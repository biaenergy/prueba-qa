# Casos funcionales de caja negra — EnergIA

## Objetivo y alcance

Validar el comportamiento observable de la UI y la API sin depender de la implementación interna. La suite cubre autenticación, autorización, consulta y navegación de medidores, filtros, ordenamiento, paginación, reglas de negocio, consistencia UI↔API, ejecución del análisis IA, manejo de errores y accesibilidad básica.

## Convenciones

- **Capa:** `UI`, `API` o `UI↔API`.
- **Técnica:** partición de equivalencia, valores límite, tabla de decisión, transición de estados, prueba negativa o comparación cruzada.
- **Estado de ejecución:** `Aprobado`, `Fallido`, `Bloqueado` o `No ejecutado`.
- **Evidencia:** guardar en `qa/evidencias/` como `bb_bia_<id>_<número>.<ext>`; ocultar contraseñas, JWT y secretos.
- Salvo indicación contraria, los casos de UI requieren sesión autenticada y los de API requieren un JWT válido.

## Casos

| ID | Capa | Técnica | Título | Precondiciones | Datos y pasos | Resultado esperado |
|---|---|---|---|---|---|---|
| BB-BIA-001 | UI↔API | Partición de equivalencia | Inicio de sesión con credenciales válidas | Frontend y backend disponibles. | En `/login`, ingresar `admin@energia.local` / `admin123` y seleccionar **Entrar**. | `POST /api/v1/auth/login` responde `200`; la UI guarda la sesión, redirige a `/` y muestra **Despacho**. |
| BB-BIA-002 | UI↔API | Partición de equivalencia y prueba negativa | Rechazo de credenciales inválidas | Login disponible. | Probar: a) contraseña incorrecta con correo válido; b) correo desconocido con cualquier contraseña. | Ambos intentos son rechazados con `401`, sin crear sesión y con un mensaje genérico que no permite enumerar usuarios. |
| BB-BIA-003 | API | Prueba negativa | Endpoints protegidos sin credenciales | Backend disponible. | Consultar sin `Authorization`: `/auth/me`, `/meter/getParams`, `/meter/getAll`, `/meter/getById/M-109`, `/anomaly/getAll`, `/dashboard/getSummary`, `/ai/analyze` y `/ai/analysis/latest`. | Cada endpoint protegido responde `401` con el contrato uniforme de error y no expone datos de negocio ni artefactos internos. |
| BB-BIA-004 | API | Partición de equivalencia y prueba negativa | JWT malformado, vencido o firmado con otro secreto | Backend disponible. | Repetir una consulta protegida con: texto no JWT, JWT vencido y JWT HS256 firmado con una clave diferente. | Las tres variantes responden `401`; ninguna concede acceso y el mensaje no revela detalles criptográficos. |
| BB-BIA-005 | UI↔API | Partición de equivalencia | Búsqueda parcial e insensible a mayúsculas | Libro de medidores abierto. | Buscar por separado `109`, `M-109`, `m-109`, `M-1` y `m-1`. | La búsqueda ignora mayúsculas/minúsculas y hace coincidencia parcial: las tres primeras entradas encuentran M-109; `M-1` y `m-1` encuentran los 12 medidores. |
| BB-BIA-006 | UI↔API | Partición de equivalencia | Búsqueda sin resultados | Libro de medidores abierto. | Buscar `M-999`. | La API responde `200` con `count: 0` y `rows: []`; la UI muestra un estado vacío comprensible, sin error técnico. |
| BB-BIA-007 | UI↔API | Tabla de decisión | Ordenamiento ascendente y descendente | Libro de medidores abierto. | Probar `meter_id`, `consumption`, `variation` y `severity`, cada uno en `ASC` y `DESC`. | El orden corresponde al campo y dirección elegidos, es estable ante empates y se conserva en la URL. |
| BB-BIA-008 | API | Valores límite | Límites de paginación | JWT válido. | En `/meter/getAll`, probar `page`: 0, 1, 2, 3 y -1; `size`: 0, 1, 10, 12, 100, 101 y -1. | Cero aplica los valores predeterminados (página 1, tamaño 10); tamaños 1–100 son válidos; una página posterior devuelve `rows: []`; valores negativos y tamaño >100 deben producir `400`, nunca `500`. |
| BB-BIA-009 | API | Partición de equivalencia y prueba negativa | Filtros inválidos y contrato de error | JWT válido. | Enviar valores inválidos para `status`, `sort_by` y `sort_order`, y un `meter_id` de 51 caracteres. | La API responde `400` y el cuerpo contiene `status_code`, `message`, `errors`, `timestamp` y `path`, con un detalle por campo inválido. |
| BB-BIA-010 | UI↔API | Prueba negativa | Detalle de medidor inexistente | Sesión autenticada. | Consultar `GET /meter/getById/M-999` y abrir `/medidores/M-999`. | La API responde `404` con contrato uniforme; la UI muestra un estado de no encontrado y ofrece volver al listado. |
| BB-BIA-011 | UI↔API | Tabla de decisión | Regla de negocio de M-109 | Datos base cargados. | Comparar M-109 en dashboard, listado, detalle, anomalías e API. | Tipo `REAL_ANOMALY`, severidad `HIGH`, prioridad 1, estado `CRITICAL`, confianza 0,95 y acción de investigar; consumo y evidencia coinciden en todas las vistas. |
| BB-BIA-012 | UI↔API | Tabla de decisión | Regla de negocio de M-112 | Datos base cargados. | Comparar M-112 en dashboard, listado, detalle, anomalías e API. | Tipo `DATA_QUALITY`, severidad `HIGH`, prioridad 2, estado `CRITICAL`, confianza 0,95 y acción de validar el medidor. |
| BB-BIA-013 | UI↔API | Tabla de decisión | Regla de negocio de M-104 | Datos base cargados. | Comparar M-104 en dashboard, listado, detalle, anomalías e API. | Tipo `EXPLAINABLE_ANOMALY`, severidad `MEDIUM`, prioridad 3, estado `ALERT`, confianza 0,86 y evento operativo relacionado. |
| BB-BIA-014 | UI↔API | Tabla de decisión | Regla de negocio de M-106 | Datos base cargados. | Comparar M-106 en dashboard, listado, detalle, anomalías e API. | Tipo `FALSE_POSITIVE`, severidad `LOW`, prioridad 4, estado `ALERT`, confianza 0,86 y acción **No escalar**, según la tabla de estados de `backend/README.md`. |
| BB-BIA-015 | UI↔API | Transición de estados | Ciclo de Run AI Analysis y control de concurrencia | Sesión autenticada. | Iniciar un análisis; consultar `/ai/analysis/{id}` y `/latest`; mientras esté `RUNNING`, intentar iniciarlo desde una segunda sesión. | La primera solicitud responde `202`; los pasos avanzan `PENDING/RUNNING/DONE`; finaliza `COMPLETED` con 4 anomalías y 2 prioritarias. La segunda solicitud reutiliza el mismo ID con `200` y no crea una ejecución paralela. |
| BB-BIA-016 | UI | Prueba exploratoria guiada | Accesibilidad y adaptación básica | Sesión autenticada. | Recorrer login, navegación, filtros, tabla, botones e investigación solo con teclado; comprobar foco, nombres accesibles, mensajes y un viewport móvil. | Todas las acciones críticas son operables con teclado, el foco es visible, estado/severidad no dependen solo del color, los mensajes se anuncian y las tablas permiten desplazamiento sin perder contenido. |

## Plantilla de ejecución

Registrar una entrada por cada caso ejecutado:

- **ID:**
- **Título:**
- **Capa y técnica:**
- **Justificación**
- **Fecha y hora:**
- **Precondiciones:**
- **Datos de prueba:**
- **Pasos ejecutados:**
- **Resultado esperado:**
- **Resultado obtenido:**
- **Estado:** Aprobado / Fallido / Bloqueado / No ejecutado.
- **Evidencia:** ruta relativa dentro de `qa/evidencias/`.
- **Defecto relacionado:** si aplica.

## Caso BB-BIA-001: 

- **ID:** BB-BIA-001
- **Título:** Inicio de sesión con credenciales válidas
- **Capa y técnica:** UI↔API / Partición de equivalencia
- **Justificación:** Se realiza esta prueba para comprobar la autenticacion mediante el JWT y que los realice manera correcta
- **Fecha y hora:** 04/10/2026
- **Precondiciones:** Frontend y backend disponibles.
- **Datos de prueba:** email - admin@energia.local, password - admin123
- **Pasos ejecutados:**
    1. En `/login`, ingresar `admin@energia.local`
    2. En Contraseña ingresar `admin123`
    3. Darle click en Entrar
- **Resultado esperado:** `POST /api/v1/auth/login` responde `200`; la UI guarda la sesión, redirige a `/` y muestra **Despacho**.
- **Resultado obtenido:** La API responde con codigo 200, y la UI nos redirige a la seccion de despacho que es donde esta nuestro Dashboard
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb_001_01.png` y `evidencias/bb_001_02.png`
- **Defecto relacionado:** No Aplica

## Caso BB-BIA-002:

- **ID:** BB-BIA-002
- **Título:** Rechazo de credenciales inválidas
- **Capa y técnica:** UI↔API / Partición de equivalencia y prueba negativa
- **Justificación:** Se certifica la autenticación de la aplicacion
- **Fecha:** 04/10/2026
- **Precondiciones:** Login disponible.
- **Datos de prueba:**
    1. Caso 1: email - admin@energia.local, password - testjasda1231
    2. Caso 2: email - adminreal@energia.local, password - admin321
- **Pasos ejecutados:** 
    1. Probar: a) contraseña incorrecta con correo válido
    1. Probar: b) correo desconocido con cualquier contraseña.
- **Resultado esperado:** Ambos intentos son rechazados con `401`, sin crear sesión y con un mensaje genérico que no permite enumerar usuarios
- **Resultado obtenido:** La API de Login responde correctamente con un codigo 401 - Unauthorize y no redirige a ningun sitio
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-002_01.png` y `evidencias/bb-002_02.png`
- **Defecto relacionado:** No Aplica

## Caso BB-BIA-003:

- **ID:** BB-BIA-003
- **Título:** Endpoints protegidos sin credenciales
- **Capa y técnica:** API / Prueba negativa
- **Justificación:** Se realiza esta prueba para certificar la seguridad desde el backen, para que un usuario no pueda ingresar tan facil al backen y ejecutar cualquier EndPoint sin autenticarse y por ende no realizar multiples peticiones y tumbar el servidor o sacar información sensible
- **Fecha:** 04/10/2026
- **Precondiciones:** Backend disponible.
- **Datos de prueba:**
- **Pasos ejecutados:** Consultar sin `Authorization`: `/auth/me`, `/meter/getParams`, `/meter/getAll`, `/meter/getById/M-109`, `/anomaly/getAll`, `/dashboard/getSummary`, `/ai/analyze` y `/ai/analysis/latest`
- **Resultado esperado:** Cada endpoint protegido responde `401` con el contrato uniforme de error y no expone datos de negocio ni artefactos internos.
- **Resultado obtenido:** Se realizan las pruebas con dos Endpoints y se valida que ambos dan como respuesta codigo 401 ya que no se encuentra logueado el usuario
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-003-01.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-004:

- **ID:** BB-BIA-004
- **Título:** JWT malformado, vencido o firmado con otro
- **Capa y técnica:** API / Partición de equivalencia y prueba negativa
- **Justificación:** Se realiza esta prueba para comprobar como se comporta el sistema cuando intento realizar peticiones en el Backend y el token que tengo de la sesion ya es uno nuevo, para ver si nos permite o no realizar peticiones
- **Fecha:** 04/10/2026
- **Precondiciones:** Backend disponible.
- **Datos de prueba:** token JWT generado desde Swagger y redactado en este documento por seguridad (`[JWT_REDACTADO]`).
- **Pasos ejecutados:** Repetir una consulta protegida con: texto no JWT, JWT vencido y con una clave diferente.
- **Resultado esperado:** Al momento de realizar una peticion esta responde con Codigo `401`
- **Resultado obtenido:** El backend deja realizar peticiones con un Token antiguo generado anteriormente
- **Estado:** Fallido
- **Evidencia:** `evidencias/` relacionadas en el Bug
- **Defecto relacionado:** `05-defectos.md` - BUG-02

## Caso BB-BIA-005:

- **ID:** BB-BIA-005
- **Título:** Búsqueda parcial e insensible a mayúsculas
- **Capa y técnica:** UI↔API / Partición de equivalencia
- **Justificación:** 
- **Fecha:** 04/10/2026
- **Precondiciones:** 
    1. Sesion iniciada
    2. Libro de medidores abierto
- **Datos de prueba:**
- **Pasos ejecutados:** Buscar por separado `109`, `M-109`, `m-109`, `M-1` y `m-1`
- **Resultado esperado:** La búsqueda ignora mayúsculas/minúsculas y hace coincidencia parcial: las tres primeras entradas encuentran M-109; `M-1` y `m-1` encuentran los 12 medidores.
- **Resultado obtenido:** El sistema funciona correctamente cuando se busca un medidor por un ID como 109 y M-109, pero cuando lo buscamos m-109 o m-1 no aparece ninguno
- **Estado:** Fallido
- **Evidencia:** `evidencias/` relacionadas en el BUG
- **Defecto relacionado:** `05-defectos.md` - BUG-03

## Caso BB-BIA-006:

- **ID:** BB-BIA-006
- **Título:** Búsqueda sin resultados
- **Capa y técnica:** UI↔API / Partición de equivalencia
- **Justificación:** Se valida que la api no devuelva datos erroneos por intentar buscar coincidencias sobre los medidores
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Sesion iniciada
    2. Libro de medidores abierto
- **Datos de prueba:**
- **Pasos ejecutados:**
    1. Iniciar sesion
    2. Ingresar a Medidores
    3. Digitar Buscar `M-999` en el buscador por Medidor 
- **Resultado esperado:** La API responde `200` con `count: 0` y `rows: []`; la UI muestra un estado vacío comprensible, sin error técnico
- **Resultado obtenido:** El sistema realiza bien la accion y nos arroja una alerta donde nos dice que "ningun medidor coincide con los filtros" y en la URL se actualiza con el Medidor ingresado
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-006-01.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-007:

- **ID:** BB-BIA-007
- **Título:** Ordenamiento ascendente y descendente
- **Capa y técnica:** UI↔API / Tabla de decisión
- **Justificación:** Se prueba para certificar que al ordenar arrojen los datos corectos por sus diferentes
- **Fecha:** 04/10/2026
- **Precondiciones:** Libro de medidores abierto
- **Datos de prueba:**
- **Pasos ejecutados:** Probar `meter_id`, `consumption`, `variation` y `severity`, cada uno en `ASC` y `DESC`
- **Resultado esperado:** El orden corresponde al campo y dirección elegidos, es estable ante empates y se conserva en la URL
- **Resultado obtenido:** El sistema permite realizar cada uno de los filtros ya sea por Medidor, Consumo, variacion y severidad
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-007-01.png`, `evidencias/bb-007-02.png`, `evidencias/bb-007-03.png` y `evidencias/bb-007-04.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-008:

- **ID:** BB-BIA-008
- **Título:** Límites de paginación
- **Capa y técnica:** API / Valores límite
- **Justificación:**
- **Fecha:** 04/10/2026
- **Precondiciones:** JWT válido
- **Datos de prueba:**
- **Pasos ejecutados:** En `/meter/getAll`, probar `page`: 0, 1, 2, 3 y -1; `size`: 0, 1, 10, 12, 100, 101 y -1.
- **Resultado esperado:** Cero aplica los valores predeterminados (página 1, tamaño 10), tamaños 1–100 son válidos, una página posterior devuelve `rows: []`, valores negativos y tamaño > 100 deben producir `400`, nunca `500`.
- **Resultado obtenido:**
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-008-01.png` y `evidencias/bb-008-02.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-009:

- **ID:** BB-BIA-009
- **Título:** Filtros inválidos y contrato de error
- **Capa y técnica:** API / Partición de equivalencia y prueba negativa
- **Justificación:** Se quiere certificar que al momento de realizar 
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Backend Iniciado
    2. JWT válido y autorizado
- **Datos de prueba:** 
    1. Primera ejecución `status` = heavy
    2. Segunda ejecución `sort_by` = menor a mayor
    3. Tercera ejecución `meter_id` = M-6321637163637136712637126376123317623712637126736123
    4. Cuarta ejecución = `meter_id` = M-6321637163637136712637126376123317623712637126736123, `sort_by` = menor a mayor y `status` = heavy
- **Pasos ejecutados:** Enviar valores inválidos para `status`, `sort_by` y `sort_order`, y un `meter_id` de 51 caracteres
- **Resultado esperado:** La API responde `400` y el cuerpo contiene `status_code`, `message`, `errors`, `timestamp` y `path`, con un detalle por campo inválido
- **Resultado obtenido:** Se recibe el error `400` de cada uno de los filtros con los datos probados anteriormente, adicional se confirma que si todos los filtros estan erroneos, se levanta sobre la misma respuesta cada error
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-009-01.png`, `evidencias/bb-009-02.png`, `evidencias/bb-009-03.png` y `evidencias/bb-009-04.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-010:

- **ID:** BB-BIA-010
- **Título:** Detalle de medidor inexistente
- **Capa y técnica:** UI↔API / Prueba negativa
- **Justificación:** Se valida integridad de datos, entre lo que me muestra la API en el backend y lo que me muestra el Frontend y que sea consistente
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Sesión autenticada en backend
    2. Sesion iniciada en EnergIA
- **Datos de prueba:**
- **Pasos ejecutados:** 
    1. Consultar `GET /meter/getById/M-999`
    2. Abrir `/medidores/` en el front
    3. Consultar el Medidor `M-999` 
- **Resultado esperado:** 
    1. La API responde `404` con contrato uniforme
    2. La UI muestra un estado de no encontrado y ofrece volver al listado
- **Resultado obtenido:**
    1. Desde el backend responde correctamente me arroja un codigo `404` con un `message`: "Medidor no ecnontrado"
    2. Se valida en el front y se visualiza el siguiente mensaje **"No existe el medidor M-999 - Revisa el código o búscalo en el libro de medidores."**
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-010-01.png` y `evidencias/bb-010-01.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-011:

- **ID:** BB-BIA-011
- **Título:** Regla de negocio de M-109
- **Capa y técnica:** UI↔API / Tabla de decisión
- **Justificación:** Se validaran reglas de negocio explicadas en el `backend/README.md`, las cuales se tienen que cumplir a la hora de correr las apis y comparar con el front, debido a que hace parte de la integridad de la información
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Datos base cargados
    2. Backend Iniciado
    3. Frontend iniciado y autenticado
- **Datos de prueba:**
- **Pasos ejecutados:**
    1. Validar el filtro de la API en Swagger ejecuanto el medidor M-109
- **Resultado esperado:** Tipo `REAL_ANOMALY`, severidad `HIGH`, prioridad 1, estado `CRITICAL`, confianza 0,95 y acción de investigar; consumo y evidencia coinciden en todas las vistas.
- **Resultado obtenido:** Se valida el resultado de la API frente a lo que se tiene en el frontend y todo corresponde segun lo indicado en el contrato de la API y el orden de prioridad tambien se encuentra establecido
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-011-01.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-012:

- **ID:** BB-BIA-012
- **Título:** Regla de negocio de M-112
- **Capa y técnica:** UI↔API / Tabla de decisión
- **Justificación:** Se validaran reglas de negocio explicadas en el `backend/README.md`, las cuales se tienen que cumplir a la hora de correr las apis y comparar con el front, debido a que hace parte de la integridad de la información
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Datos base cargados
    2. Backend Iniciado
    3. Frontend iniciado y autenticado
- **Datos de prueba:**
- **Pasos ejecutados:**
    1. Validar el filtro de la API en Swagger ejecuanto el medidor M-112
- **Resultado esperado:** Tipo `DATA_QUALITY`, severidad `HIGH`, prioridad 2, estado `CRITICAL`, confianza 0,95 y acción de validar el medidor
- **Resultado obtenido:** Se valida el resultado de la API frente a lo que se tiene en el frontend y todo corresponde segun lo indicado en el contrato de la API y el orden de prioridad tambien se encuentra establecido
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-012-01.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-013:

- **ID:** BB-BIA-013
- **Título:** Regla de negocio de M-104
- **Capa y técnica:** UI↔API / Tabla de decisión
- **Justificación:** Se validaran reglas de negocio explicadas en el `backend/README.md`, las cuales se tienen que cumplir a la hora de correr las apis y comparar con el front, debido a que hace parte de la integridad de la información
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Datos base cargados
    2. Backend Iniciado
    3. Frontend iniciado y autenticado
- **Datos de prueba:**
- **Pasos ejecutados:**
    1. Validar el filtro de la API en Swagger ejecuanto el medidor M-104
- **Resultado esperado:** Tipo `EXPLAINABLE_ANOMALY`, severidad `MEDIUM`, prioridad 3, estado `ALERT`, confianza 0,86 y evento operativo relacionado
- **Resultado obtenido:** Se valida el resultado de la API frente a lo que se tiene en el frontend y todo corresponde segun lo indicado en el contrato de la API y el orden de prioridad tambien se encuentra establecido
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-013-01.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-014:

- **ID:** BB-BIA-014
- **Título:** Regla de negocio de M-106
- **Capa y técnica:** UI↔API / Tabla de decisión
- **Justificación:** Se validaran reglas de negocio explicadas en el `backend/README.md`, las cuales se tienen que cumplir a la hora de correr las apis y comparar con el front, debido a que hace parte de la integridad de la información
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Datos base cargados
    2. Backend Iniciado
    3. Frontend iniciado y autenticado
- **Datos de prueba:**
- **Pasos ejecutados:**
    1. Validar el filtro de la API en Swagger ejecuanto el medidor M-106
- **Resultado esperado:** Tipo `FALSE_POSITIVE`, severidad `LOW`, prioridad 4, estado `ALERT`, confianza 0,86 y acción **No escalar**, según la tabla de estados de `backend/README.md`
- **Resultado obtenido:** Se valida el resultado de la API frente a lo que se tiene en el frontend y todo corresponde segun lo indicado en el contrato de la API y el orden de prioridad tambien se encuentra establecido y el orden de prioridad tambien se encuentra establecido
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-014-01.png`
- **Defecto relacionado:** No aplica.

## Caso BB-BIA-015:

- **ID:** BB-BIA-015
- **Título:** Ciclo de Run AI Analysis y control de concurrencia
- **Capa y técnica:** UI↔API / Transición de estados
- **Justificación:** Se realiza esta prueba para verificar como el sistema actua frente a dos ejecuciones en paralelo con el mismo usuario y ver su comportamiento
- **Fecha:** 04/10/2026
- **Precondiciones:**
    1. Backend activo
    2. Frontend activo
- **Datos de prueba:**
- **Pasos ejecutados:**
    1. Iniciar sesion
    2. Dar click derecho y abrir el inspector
    3. Abrir la ventana de Network
    4. Dar click en el Boton de Run AI Analysis 
- **Resultado esperado:** Iniciar un análisis; consultar `/ai/analysis/{id}` y `/latest`; mientras esté `RUNNING`, intentar iniciarlo desde una segunda sesión. | La primera solicitud responde `202`; los pasos avanzan `PENDING/RUNNING/DONE`; finaliza `COMPLETED` con 4 anomalías y 2 prioritarias. La segunda solicitud reutiliza el mismo ID con `200` y no crea una 
- **Resultado obtenido:** EL sistema si permite correr dos Analisis desde la misma cuenta en paralelo, segun la documentación esto no debe de pasar, deberia de poder identificar la ejecución que esta corriendo actualmente, pero eso no esta sucediendo
- **Estado:** Fallido
- **Evidencia:** `evidencias/` se relacionan en el BUG
- **Defecto relacionado:** `05-defectos.md` - BUG-04

## Caso BB-BIA-016:

- **ID:** BB-BIA-016
- **Título:** Accesibilidad y adaptación básica
- **Capa y técnica:** UI / Prueba exploratoria guiada
- **Justificación:** Se valida la accesibilidad dentro del sistema, que sea de buen manejo
- **Fecha:** 04/10/2026
- **Precondiciones:** Sesion iniciada previamente
- **Datos de prueba:**
- **Pasos ejecutados:** Recorrer login, navegación, filtros, tabla, botones e investigación solo con teclado; comprobar foco, nombres accesibles, mensajes y un viewport móvil
- **Resultado esperado:** Todas las acciones críticas son operables con teclado, el foco es visible, estado/severidad no dependen solo del color, los mensajes se anuncian y las tablas permiten desplazamiento sin perder contenido, adicional si se usa desde un movil tambien se permite el manejo correctamente
- **Resultado obtenido:** En diferetes vistas el responsive de la pagina es bastante bien, es entendible a primera vista, y no se pierde continido o se ve sobresaturado
- **Estado:** Aprobado
- **Evidencia:** `evidencias/bb-video-016`
- **Defecto relacionado:** No aplica.
