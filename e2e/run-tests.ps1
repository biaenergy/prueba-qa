param(
    [switch]$Headed
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$e2eDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = Split-Path -Parent $e2eDirectory
$backendDirectory = Join-Path $repositoryRoot 'backend'
$frontendDirectory = Join-Path $repositoryRoot 'frontend'
$runtimeDirectory = Join-Path $e2eDirectory '.runtime'

$backendProcess = $null
$frontendProcess = $null
$exitCode = 1

function Test-Endpoint {
    param([string]$Url)

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    }
    catch {
        return $false
    }
}

function Wait-ForEndpoint {
    param(
        [string]$Url,
        [string]$ServiceName,
        [System.Diagnostics.Process]$Process
    )

    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline) {
        if ($Process.HasExited) {
            throw "$ServiceName terminó antes de estar disponible. Revisa los archivos de .runtime/."
        }
        if (Test-Endpoint -Url $Url) {
            return
        }
        Start-Sleep -Milliseconds 250
    }

    throw "$ServiceName no respondió en $Url después de 60 segundos."
}

try {
    New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

    if ([string]::IsNullOrWhiteSpace($env:BASE_URL)) {
        if (-not (Test-Endpoint -Url 'http://127.0.0.1:8080/health')) {
            Write-Host 'Preparando e iniciando el backend...'
            $apiExecutable = Join-Path $runtimeDirectory 'energia-api.exe'

            Push-Location $backendDirectory
            try {
                & go build -o $apiExecutable ./cmd/api
                if ($LASTEXITCODE -ne 0) {
                    throw 'No se pudo compilar el backend.'
                }
            }
            finally {
                Pop-Location
            }

            $backendProcess = Start-Process `
                -FilePath $apiExecutable `
                -WorkingDirectory $backendDirectory `
                -WindowStyle Hidden `
                -RedirectStandardOutput (Join-Path $runtimeDirectory 'backend-out.log') `
                -RedirectStandardError (Join-Path $runtimeDirectory 'backend-error.log') `
                -PassThru

            Wait-ForEndpoint -Url 'http://127.0.0.1:8080/health' -ServiceName 'El backend' -Process $backendProcess
        }
        else {
            Write-Host 'Backend ya disponible; se reutilizara.'
        }

        if (-not (Test-Endpoint -Url 'http://127.0.0.1:5173')) {
            Write-Host 'Iniciando el frontend...'
            $nodeExecutable = (Get-Command node -ErrorAction Stop).Source
            $viteScript = Join-Path $frontendDirectory 'node_modules\vite\bin\vite.js'
            if (-not (Test-Path -LiteralPath $viteScript)) {
                throw 'No se encontró Vite. Ejecuta pnpm install dentro de frontend/.'
            }

            $frontendProcess = Start-Process `
                -FilePath $nodeExecutable `
                -ArgumentList @("`"$viteScript`"", '--host', '127.0.0.1') `
                -WorkingDirectory $frontendDirectory `
                -WindowStyle Hidden `
                -RedirectStandardOutput (Join-Path $runtimeDirectory 'frontend-out.log') `
                -RedirectStandardError (Join-Path $runtimeDirectory 'frontend-error.log') `
                -PassThru

            Wait-ForEndpoint -Url 'http://127.0.0.1:5173' -ServiceName 'El frontend' -Process $frontendProcess
        }
        else {
            Write-Host 'Frontend ya disponible; se reutilizara.'
        }
    }
    else {
        Write-Host "Usando la aplicacion indicada en BASE_URL: $env:BASE_URL"
    }

    $playwright = Join-Path $e2eDirectory 'node_modules\.bin\playwright.cmd'
    if (-not (Test-Path -LiteralPath $playwright)) {
        throw 'Playwright no está instalado. Ejecuta pnpm install dentro de e2e/.'
    }

    $arguments = @('test')
    if ($Headed) {
        $arguments += '--headed'
    }

    & $playwright @arguments
    $exitCode = $LASTEXITCODE
}
catch {
    Write-Error $_
    $exitCode = 1
}
finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

exit $exitCode
