# Automatización E2E · EnergIA

Suite de Playwright en TypeScript para validar el flujo principal de análisis y documentar el defecto de paginación `BUG-01`.

## Cobertura

### Flujo de negocio

1. Inicia sesión una sola vez y reutiliza la sesión mediante `storageState`.
2. Lee el ID del último análisis mostrado en el frontend.
3. Ejecuta **Run AI Analysis**.
4. Espera un ID nuevo y la finalización de los siete pasos, sin esperas fijas.
5. Comprueba que la UI muestre 4 anomalías y 2 prioritarias.
6. Contrasta el ID y el resumen con `/api/v1/ai/analysis/latest`.
7. Abre **Anomalías IA** y valida el orden, tipo, severidad y acción de M-109, M-112, M-104 y M-106.

### BUG-01 · Paginación

El Libro de medidores informa `1–10 de 12 medidores`, pero el botón **Siguiente** está deshabilitado. El test expresa el comportamiento correcto —el botón debería estar habilitado— y está marcado con `test.fail()` porque el defecto existe actualmente.

Cuando se corrija el defecto, se debe quitar la línea `test.fail()` de `tests/pagination-bug.spec.ts`; la misma aserción pasará sin cambiar el objetivo del test.

## Requisitos

- Go 1.26 o superior.
- Node.js 20.19 o superior.
- pnpm.
- Google Chrome.
- Dependencias del frontend instaladas (`pnpm install` dentro de `frontend/`).

No es necesario encender la aplicación manualmente. El comando de pruebas compila e inicia el backend, inicia el frontend, espera a que ambos estén disponibles y finalmente ejecuta Playwright. Si alguno ya estaba encendido, lo reutiliza. Al terminar solo cierra los procesos que inició.

## Instalación inicial

Desde la carpeta `e2e/`:

```bash
npm install -g pnpm
```

## Ejecutar los tests

Desde la raíz del repositorio, toda la suite se ejecuta con un solo comando:

```bash
pnpm --dir e2e test
```

El reporte HTML queda en `e2e/playwright-report/`. Para abrirlo:

```bash
pnpm --dir e2e report
```

## Otras opciones

Ejecución mostrando el navegador:

```bash
pnpm --dir e2e test:headed
```

Si la aplicación ya está desplegada en otra URL, debe estar encendida y se puede indicar así en PowerShell:

```powershell
$env:BASE_URL = 'http://localhost:3000'
pnpm --dir e2e test
```

Las credenciales predeterminadas son las proporcionadas por el proyecto. Se pueden reemplazar sin cambiar el código:

```powershell
$env:E2E_EMAIL = 'usuario@ejemplo.com'
$env:E2E_PASSWORD = 'contraseña'
pnpm --dir e2e test
```

## Organización

```text
e2e/
├── README.md
├── package.json
├── playwright.config.ts
├── run-tests.ps1
├── tsconfig.json
└── tests/
    ├── auth.setup.ts
    ├── analysis-flow.spec.ts
    ├── pagination-bug.spec.ts
    ├── data/
    │   └── expected-results.ts
    └── pages/
        ├── analysis.page.ts
        ├── anomalies.page.ts
        ├── login.page.ts
        └── meters.page.ts
```

Los Page Objects mantienen los locators fuera de los tests. Los datos esperados están separados en `tests/data/`, y el login se ejecuta una vez antes de los demás casos.
