# Parte D · Pruebas de caja blanca

## 1. Alcance y ejecución

Se revisó código de backend y frontend, con énfasis en módulos con muchas ramas, entrada controlada por el usuario o impacto directo en la decisión operativa.

Comandos ejecutados:

```powershell
cd backend
go test -count=1 -coverprofile=coverage.out ./...
go tool cover -func=coverage.out

cd ../frontend
corepack pnpm test
```

Resultados:

- Backend: toda la suite pasó. Se identificaron 41 funciones de prueba y una cobertura total de **51,3 % de statements**.
- Frontend: **3 archivos y 11 tests pasaron**.
- No se modificó el código productivo durante esta revisión.

La cobertura se usa como señal para orientar la revisión, no como objetivo por sí sola. Un porcentaje alto no demuestra que los asserts sean correctos y un paquete con 0 % puede estar transitado indirectamente por una prueba de integración sin quedar instrumentado como paquete bajo prueba.

## 2. Módulo de riesgo 1: paginación HTTP

**Archivos revisados:**

- `backend/internal/httpx/paging.go`
- `backend/internal/meter/dto.go`
- `backend/internal/meter/service.go`
- `backend/internal/meter/service_test.go`

### Motivo del riesgo

La paginación recibe datos no confiables desde la API y calcula índices usados para cortar un slice. Un error de validación puede provocar una respuesta incorrecta o un `panic`.

### Ramas y condiciones revisadas

`Pagination.Normalize()` contempla:

- `page == 0`: usa la página 1 por defecto.
- `size == 0`: usa 10 por defecto.
- `size < 1` o `size > 100`: devuelve error.
- No contempla `page < 0`.

`Paginate()` calcula:

```go
start := min((p.Page-1)*p.Size, len(items))
end := min(start+p.Size, len(items))
rows := items[start:end]
```

Para `page = -1` y `size = 10`, `start` queda negativo. Al usar ese valor como índice, Go genera un `panic`.

### Defecto confirmado

Se envió directamente a la API autenticada:

```json
{
  "pagination": {
    "page": -1,
    "size": 10
  }
}
```

**Resultado esperado:** `400 Bad Request`, indicando que `pagination.page` debe ser mayor o igual a 1.

**Resultado obtenido:** `500 Internal Server Error`.

La interfaz web reduce la probabilidad porque `parseMeterFilters()` convierte una página negativa a 1, pero la API es pública para cualquier cliente y debe validar la entrada por sí misma. El frontend no debe ser el control de seguridad del backend.

### Tests existentes y huecos

`TestGetAllPagination` cubre:

- Una página intermedia.
- Una página superior al total, esperando `[]` y no `null`.

`TestNormalizeRejectsInvalid` cubre tamaño 500 y filtros inválidos, pero no cubre:

- Página negativa.
- Tamaño negativo.
- Valores exactos de frontera: tamaños 1 y 100.
- Respuesta HTTP ante una página inválida.

### Tests propuestos

Este test unitario debería fallar con la implementación actual y evidencia el defecto:

```go
func TestPaginationRejectsPageBelowOne(t *testing.T) {
    p := Pagination{Page: -1, Size: 10}

    errs := p.Normalize()

    if len(errs) == 0 {
        t.Fatal("esperaba error para pagination.page < 1")
    }
}
```

También agregaría un test a nivel de router para verificar el contrato HTTP:

```go
func TestGetAllRejectsNegativePage(t *testing.T) {
    // Arrange: servidor y token válidos.
    // Act: POST /meter/getAll con page=-1.
    // Assert: status 400, status_code 400 y un error sobre pagination.page.
}
```

Casos adicionales recomendados:

| Caso | Resultado esperado |
|---|---|
| `page=1`, `size=1` | Válido; primera fila |
| `page=1`, `size=100` | Válido; límite superior |
| `page=0`, `size=0` | Valores por defecto 1 y 10 |
| `page=-1` | Error de validación, nunca `panic` |
| `size=-1` | Error de validación |
| Página posterior a la última | `rows: []`, status 200 |

## 3. Módulo de riesgo 2: clasificación de anomalías

**Archivos revisados:**

- `backend/internal/analysis/classify/classify.go`
- `backend/internal/analysis/classify/confidence.go`
- `backend/internal/analysis/classify/events.go`
- `backend/internal/analysis/classify/events_test.go`
- `backend/internal/analysis/analyze_test.go`

### Motivo del riesgo

Este módulo decide el tipo, severidad, confianza, explicación y acción recomendada. Un error puede cambiar qué medidor se investiga primero o convertir una anomalía real en falso positivo. Tiene impacto directo en el negocio y varias ramas basadas en umbrales.

La cobertura propia del paquete es solo **4,1 %**. Hay cobertura indirecta mediante las pruebas de integración del motor con el CSV real, pero casi no hay tests unitarios que aíslen sus reglas.

### Ramas y condiciones revisadas

En `Change()` existen tres caminos principales:

1. Sin evento explicativo → `REAL_ANOMALY`.
2. Con evento explicativo y cambio finalizado → `FALSE_POSITIVE`.
3. Con evento explicativo y cambio activo → `EXPLAINABLE_ANOMALY`.

En `realSeverity()` existen fronteras relevantes:

- Variación absoluta menor a 20 % → `LOW`.
- Variación absoluta desde 20 % → `MEDIUM`.
- Variación desde 50 % **y** cambio activo → `HIGH`.
- Variación desde 50 % pero cambio finalizado → `MEDIUM`.

En `DataQuality()`:

- Menos de 12 horas marcadas → `MEDIUM`.
- Desde 12 horas marcadas → `HIGH`.
- La confianza cambia según consumo estable, voltaje, factor de potencia y existencia de un evento de calidad.

En `corroboration()`:

- Consumo sin cambio → fuerza 0.
- Corriente en dirección contraria → se limita a 0.
- Corriente proporcional → valor entre 0 y 1.
- Corriente con cambio mayor al consumo → se limita a 1.

### Tests existentes y huecos

`TestExplainingEvent` está bien diseñado como tabla y cubre:

- Parada programada que explica una caída, pero no un aumento.
- Cambio operativo.
- Evento `UNKNOWN`.
- Fronteras temporales de +6 h y +7 h.

`TestAnalyzeRealData` valida los cuatro resultados esperados del dataset: M-109, M-112, M-104 y M-106. Es una prueba de integración valiosa, pero depende de un dataset grande y solo representa una combinación por regla. No aísla las fronteras ni permite saber rápidamente qué condición se rompió.

Faltan tests unitarios para:

- Las tres ramas de `Change()` con datos mínimos inventados.
- Fronteras exactas de 19,99 %, 20 %, 49,99 % y 50 %.
- Aumentos y caídas; la severidad usa valor absoluto pero la acción recomendada cambia por dirección.
- Cambio de 50 % finalizado frente a activo.
- Calidad con 11 y 12 horas marcadas.
- Confianza con pesos incompletos, confianza de eventos multiplicada por `eventTrust` y límites 0,5–0,95.
- Recomendación de aumento con y sin cambio del factor de potencia.

### Tests propuestos

Ejemplo para las fronteras de severidad:

```go
func TestRealSeverityBoundaries(t *testing.T) {
    tests := []struct {
        name    string
        pct     float64
        ongoing bool
        want    model.Severity
    }{
        {"debajo de 20", 19.99, true, model.SeverityLow},
        {"exactamente 20", 20, true, model.SeverityMedium},
        {"debajo de 50", 49.99, true, model.SeverityMedium},
        {"50 activo", 50, true, model.SeverityHigh},
        {"50 finalizado", 50, false, model.SeverityMedium},
        {"caída activa mayor a 50", -60, true, model.SeverityHigh},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := realSeverity(changes.Change{ChangePct: tt.pct, Ongoing: tt.ongoing})
            if got != tt.want {
                t.Fatalf("realSeverity() = %s, esperaba %s", got, tt.want)
            }
        })
    }
}
```

También propondría una tabla para `Change()`:

| Evento explicativo | Cambio activo | Resultado esperado | `anomaly` |
|---|---:|---|---:|
| No | Sí o no | `REAL_ANOMALY` | `true` |
| Sí | No | `FALSE_POSITIVE` | `false` |
| Sí | Sí | `EXPLAINABLE_ANOMALY` | `true` |

Y para calidad de datos:

```go
func TestDataQualitySeverityBoundary(t *testing.T) {
    // Ejecutar con FlaggedHours=11 y esperar MEDIUM.
    // Ejecutar con FlaggedHours=12 y esperar HIGH.
    // Verificar además DetectedAt, Evidence.Quality y cuatro checks de confianza.
}
```

## 4. Módulo de riesgo 3: sesión y autenticación del frontend

**Archivos revisados:**

- `frontend/src/features/auth/AuthProvider.tsx`
- `frontend/src/features/auth/RequireAuth.tsx`
- `frontend/src/features/auth/components/useLoginForm.ts`
- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/token-storage.ts`

### Motivo del riesgo

Este flujo controla acceso, persistencia del JWT, restauración de sesión, cierre por `401` y redirección a la ruta original. Una regresión puede dejar contenido protegido visible, crear bucles de navegación o conservar datos de otro usuario en la caché.

### Condiciones revisadas

`AuthProvider` tiene tres estados:

- Sin token → `anonymous`.
- Con token mientras `/auth/me` está pendiente → `checking`.
- Con usuario válido → `authenticated`.
- Con token y error en `/auth/me` → `anonymous`.

Además:

- Login guarda token, precarga el usuario y cambia el estado.
- Logout elimina token y limpia toda la caché de TanStack Query.
- Cualquier `401`, salvo el de `/auth/login`, dispara `energyai:unauthorized` y hace logout.
- `RequireAuth` conserva `pathname + search` para volver después del login.
- `tokenStorage` silencia errores de `localStorage`.

### Tests existentes y huecos

No hay pruebas del flujo de autenticación del frontend. Las 11 pruebas existentes solo cubren:

- Formato regional y hora de planta.
- Lectura de filtros desde la URL y construcción del request.
- Texto y atributos accesibles de marcas visuales.

Faltan pruebas para:

- Restaurar una sesión con token válido.
- Token vencido o `/auth/me` con 401.
- Ver el estado “Validando sesión…” mientras se consulta `/auth/me`.
- Login correcto y navegación a la ruta original.
- Login 401 y mensaje específico.
- Error de red y mensaje genérico.
- Logout: token eliminado y query cache limpia.
- Interceptor: incluir `Authorization` cuando existe token.
- No disparar logout por un 401 del propio login.
- Manejo de excepciones de `localStorage`.

Tests propuestos con React Testing Library y mocks de red:

```ts
it('cierra la sesión cuando una petición protegida responde 401', async () => {
  // Guardar token, renderizar AuthProvider y resolver /auth/me con usuario.
  // Disparar UNAUTHORIZED_EVENT.
  // Verificar estado anonymous, token eliminado y caché limpia.
})

it('redirige al login y conserva pathname y search', () => {
  // Renderizar RequireAuth como anonymous en /medidores?estado=CRITICAL.
  // Verificar navegación a /login con from=/medidores?estado=CRITICAL.
})

it('no dispara logout cuando el login responde 401', async () => {
  // Simular AxiosError de /auth/login.
  // Verificar ApiError 401 y ausencia del evento unauthorized.
})
```

## 5. Evaluación de confianza en los tests existentes

### Backend

**Confianza media-alta para el flujo principal y media-baja para casos borde.**

Fortalezas:

- El motor completo se ejecuta con datos reales y valida las cuatro anomalías esperadas.
- Estadísticas, calidad, cambios, autenticación y servicio de medidores tienen tests específicos.
- `server_test.go` atraviesa router, middleware, login, filtros, dashboard y ejecución del análisis.
- Los tests son determinísticos y no dependen de OpenAI; usan un narrador falso.

Limitaciones:

- Varias reglas críticas solo están cubiertas por el CSV real, no por casos mínimos de frontera.
- Paquetes centrales sin tests unitarios propios: `variables`, `store`, `dashboard`, `httpx` y handlers.
- El cliente HTTP de OpenAI no prueba éxito, timeout, errores HTTP, JSON inválido, respuesta sin opciones o campos vacíos.
- No se ejecuta `go test -race ./...` para validar el `RWMutex` del store y la concurrencia del análisis.
- Algunas aserciones son amplias; por ejemplo, aceptar cualquier confianza entre 0,7 y 0,95 puede ocultar una regresión en los pesos.

### Frontend

**Confianza baja para la aplicación completa y alta únicamente para las utilidades probadas.**

Fortalezas:

- Los tests son pequeños, legibles y rápidos.
- Hay una prueba explícita de accesibilidad: el estado no depende solo del color.
- Se valida que los filtros inválidos de URL no lleguen a la API.
- Se protege el tratamiento especial de la hora de planta.

Limitaciones:

- Solo existen 11 tests para toda la aplicación.
- No se prueban autenticación, llamadas HTTP, estados de carga/error, rutas protegidas ni logout por 401.
- No se prueban componentes de paginación, tablas, gráficas, dashboard ni ejecución/polling del análisis.
- No se verifica invalidación de caché de TanStack Query después de ejecutar un análisis.
- Los tests de componentes visuales validan elementos aislados, pero no interacción de pantallas completas.

## 6. Priorización de los tests faltantes

| Prioridad | Test o grupo | Razón |
|---|---|---|
| P0 | Página negativa debe responder 400 | Ya se confirmó un 500 y posible `panic` por índice negativo |
| P0 | Tres ramas de `classify.Change()` | Determinan si se escala o se descarta una anomalía |
| P0 | Fronteras de severidad 20 % y 50 % | Un cambio mínimo alrededor del umbral modifica prioridad operativa |
| P1 | `variables.Compare()` y `changed()` | Alimentan la evidencia y confianza de la clasificación |
| P1 | Restauración de sesión y logout por 401 | Controlan acceso y protección de datos del frontend |
| P1 | Store con `go test -race` | Las anomalías se reemplazan durante análisis en segundo plano |
| P2 | Cliente OpenAI con `httptest.Server` | Debe degradar correctamente sin alterar la clasificación |
| P2 | Dashboard sin anomalías y promedio de confianza | Evita divisiones o resúmenes incoherentes en datasets distintos |

## 7. Conclusión

La suite actual da buena confianza sobre el dataset entregado y el camino feliz principal, pero no suficiente sobre entradas hostiles, umbrales exactos y estados del frontend. La revisión de caja blanca encontró un defecto reproducible de validación (`page=-1` produce 500) y mostró que la clasificación crítica depende demasiado de pruebas de integración con un único dataset. La siguiente inversión de pruebas debería concentrarse en paginación, fronteras de clasificación y autenticación del frontend.
