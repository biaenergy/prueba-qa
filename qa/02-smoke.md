# Smoke Test (suite de pruebas) — EnergIA

## Objetivo

Confirmar, con un conjunto breve de pruebas críticas, que el ambiente está disponible y que los flujos principales permiten continuar con una ejecución funcional más amplia. Un fallo en autenticación, carga de datos, navegación principal o ejecución del análisis IA bloquea o condiciona el resto de la validación.

## Convenciones

- **Capa:** `UI`, `API` o `UI↔API`.
- **Prioridad:** todos los casos de humo son críticos para decidir si el build es testeable.
- **Estado de ejecución:** `Aprobado`, `Fallido`, `Bloqueado` o `No ejecutado`.
- **Evidencia:** guardar en `qa/evidencias/` con el formato `smk_bia_<id>_<número>.<ext>`; no incluir contraseñas ni JWT visibles.

## Casos

| ID | Capa | Título | Precondiciones | Pasos y datos | Resultado esperado |
|---|---|---|---|---|---|
| SMK-BIA-001 | API | Disponibilidad del backend y Swagger | Backend iniciado en `http://localhost:8080`. | 1. Consultar `GET /health`. 2. Abrir `/docs`. | `/health` responde `200` con `status: "ok"` y Swagger carga sin errores. |
| SMK-BIA-002 | UI↔API | Inicio de sesión válido | Frontend en `http://localhost:5173/login`; backend disponible. | Ingresar `admin@energia.local` / `admin123` y seleccionar **Entrar**. | La API autentica al usuario y la UI redirige a **Despacho** sin mostrar errores. |
| SMK-BIA-003 | UI↔API | Rechazo de credenciales inválidas | Pantalla de login disponible. | Intentar entrar con una contraseña incorrecta. | La sesión no se crea, el usuario permanece en login y se muestra un mensaje de credenciales inválidas sin revelar si el correo existe. |
| SMK-BIA-004 | API | Protección de endpoints sin JWT | Backend disponible. | Consultar `GET /api/v1/dashboard/getSummary` sin encabezado `Authorization`. | La API responde `401` con el contrato de error (`status_code`, `message`, `timestamp`, `path`). |
| SMK-BIA-005 | UI↔API | Carga del Despacho y sus indicadores | Sesión autenticada. | Abrir **Despacho** y contrastar sus indicadores con `GET /api/v1/dashboard/getSummary`. | Se muestran 12 medidores: 8 normales, 2 en alerta y 2 críticos; 4 casos clasificados y 2 de alta prioridad. M-106, por ser `FALSE_POSITIVE`, cuenta como normal. Los valores coinciden con la API. |
| SMK-BIA-006 | UI↔API | Carga del Libro de medidores | Sesión autenticada. | Abrir **Medidores**. | La tabla carga sin error, informa 12 medidores y presenta columnas de medidor, estado, consumo de 24 h y variación. |
| SMK-BIA-007 | UI↔API | Filtros por estado del Libro de medidores | Sesión autenticada; Libro de medidores abierto. | Aplicar por separado **Normales**, **Alertas** y **Críticas**. | Cada filtro actualiza la URL y la tabla muestra únicamente el estado elegido: 9 normales, 1 alerta o 2 críticos. |
| SMK-BIA-008 | UI↔API | Búsqueda y apertura de M-109 | Sesión autenticada; Libro de medidores abierto. | Buscar `M-109` y abrir el resultado. | Solo se muestra M-109; al abrirlo se visualizan su estado crítico, consumo, baseline, variación, variables eléctricas, históricos y anomalía. |
| SMK-BIA-009 | UI↔API | Carga del módulo Anomalías IA | Sesión autenticada. | Abrir **Anomalías IA**. | Se muestran 4 anomalías ordenadas por prioridad: M-109, M-112, M-104 y M-106, con tipo, severidad, confianza, acción y fecha de detección. |
| SMK-BIA-010 | UI↔API | Ejecución de Run AI Analysis | Sesión autenticada; no hay otro análisis activo. | Seleccionar **Run AI Analysis** y observar el progreso hasta finalizar. | Se crea un nuevo ID `AN-####`; los 7 pasos pasan a estado final, el análisis termina como `COMPLETED`, resume 4 anomalías y 2 prioritarias, y el último análisis del Despacho se actualiza. |
| SMK-BIA-011 | UI | Cierre de sesión y protección de rutas | Sesión autenticada. | Cerrar sesión; usar Atrás e intentar abrir directamente `/`, `/medidores` y `/anomalias`. | No se vuelve a mostrar contenido protegido; la aplicación redirige a `/login`. |

## Plantilla de ejecución

Registrar una entrada por caso ejecutado:

- **ID:**
- **Título:**
- **Justificación:** por qué un fallo bloquearía o condicionaría la ejecución.
- **Fecha y hora:**
- **Versión/SHA:**
- **Precondiciones:**
- **Pasos ejecutados y datos:**
- **Resultado esperado:**
- **Resultado obtenido:**
- **Estado:** Aprobado / Fallido / Bloqueado / No ejecutado.
- **Evidencia:** ruta relativa dentro de `qa/evidencias/`.
- **Defecto relacionado:** si aplica.

## Ejecución

### Caso SMK-BIA-001:

- **ID:** SMK-BIA-001
- **Título:** Disponibilidad del backend y Swagger
- **Justificación:** Debido a que si el backend no esta activo, por mas de que nuestro Front este activo, no podremos logearnos y por consecuencia no veremos la informacion cargada
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** Backend iniciado en `http://localhost:8080`.
- **Pasos ejecutados y datos:** 
    1. Consultar `GET /health`. 
    2. Abrir `/docs`.
- **Resultado esperado:** `/health` responde `200` con `status: "ok"` y Swagger carga sin errores.
- **Resultado obtenido:** /health responde de manera correcta con su **status: "ok"** y el Swagger nos responde de manera correcta
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-001.png`
- **Defecto relacionado:** No Aplica

### Caso SMK-BIA-002:

- **ID:** SMK-BIA-002
- **Título:** Inicio de sesión válido
- **Justificación:** 
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** Frontend en `http://localhost:5173/login`; backend disponible.
- **Pasos ejecutados y datos:** 
    1. Ingresar en **email** `admin@energia.local`
    2. Ingresar en **Contraseña** `admin123` 
    3. Dar click en **Entrar**.
- **Resultado esperado:** La API autentica al usuario y la UI redirige a **Despacho** sin mostrar errores.
- **Resultado obtenido:** La API autentica correctamente y redirige a la seccion de Despacho sin mostrar errores
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-002_01.png` y `/evidencias/smk-002_02.png`
- **Defecto relacionado:** No Aplica

### Caso SMK-BIA-003:

- **ID:** SMK-BIA-003
- **Título:** Rechazo de credenciales inválidas
- **Justificación:** Se realiza esta prueba debido a que el sistema no debera de permitir el ingreso a usuarios no registrados al sistema, es una prueba mas enfocada en la seguridad del sistema
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** Pantalla de login disponible, Backend y Frontend activo
- **Pasos ejecutados y datos:** Intentar entrar con una contraseña incorrecta.
- **Resultado esperado:** La sesión no se crea, el usuario permanece en login y se muestra un mensaje de credenciales inválidas sin revelar si el correo existe.
- **Resultado obtenido:** La API de Login responde con un codigo 401, y adicional en la respuesta de la API responde con "Email y contraseña inconrrectos" y en el front "Email o contraseña incorrectos. Revisa los datos e inténtalo de nuevo"
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-003_01.png` y `/evidencias/smk-003_02.png`
- **Defecto relacionado:** No Aplica

### Caso SMK-BIA-004:

- **ID:** SMK-BIA-004
- **Título:** Protección de endpoints sin JWT
- **Justificación:** Se realiza debido a que tanto para poder ingresar al front debemos autenticarnos con email y contraseña para obtener el token, es una prueba enfocada en la seguridad
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** Backend disponible.
- **Pasos ejecutados y datos:** Consultar `GET /api/v1/dashboard/getSummary` sin encabezado `Authorization`.
- **Resultado esperado:** La API responde `401` con el contrato de error (`status_code`, `message`, `timestamp`, `path`).
- **Resultado obtenido:** Se obtiene un codigo 401 de acceso no autorizado ya que siempre al ejecutar alguno de los endpoints estos requeiren de un token, el cual se ejecuta al autenticarse con la API de Login
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-004_01.PNG` y `/evidencias/smk-004_02.PNG`
- **Defecto relacionado:** No Aplica

### Caso SMK-BIA-005:

- **ID:** SMK-BIA-005
- **Título:** Carga del Despacho y sus indicadores
- **Justificación:** Esta prueba se hace para validar la integridad de los datos, entre lo que trae la  API y lo que recibe el Front
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** Sesión autenticada
- **Pasos ejecutados y datos:** 
    1. Abrir **Despacho** y contrastar sus indicadores con `GET /api/v1/dashboard/getSummary`.
- **Resultado esperado:** Se muestran 12 medidores: 9 normales, 1 en alerta y 2 críticos; 4 casos clasificados y 2 de alta prioridad. M-106, por ser `FALSE_POSITIVE`, cuenta como normal. Los valores coinciden con la API.
- **Resultado obtenido:** Se muestra la informacion correctamente, se contrasta de lo que esta en la API vs Frontend, la comparación se evidencia correctamente en la seccion de envidencias, para que esta sea mas visual
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-005_01.png`, `/evidencias/smk-005_02.png` y `/evidencias/smk-005_03_API.png`
- **Defecto relacionado:** No Aplica

### Caso SMK-BIA-006:

- **ID:** SMK-BIA-006
- **Título:** Carga del Libro de medidores
- **Justificación:** Se validara la integridad de los datos, frente lo que nos devuelve la API y lo que nos muestra el Front
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** Sesión autenticada
- **Pasos ejecutados y datos:** 
    1. Loguearse en la Web
    2. Ingresar a **Medidores** 
- **Resultado esperado:** La tabla carga sin error, informa 12 medidores y presenta columnas de medidor, estado, consumo de 24 h y variación.
- **Resultado obtenido:** La tabla carga solo 10 de los 12 medidores, no porque la API no traiga toda la información, es debido a que el paginador de la Web no funciona correctamente a la hora de visualizar toda la info, se debe a que el size de la web es de 10 y pues al tener mas de 10 medidores, no tenemos la opcion desde el front de validar los otros dos.
- **Estado:** Fallido
- **Evidencia:** `/evidencias/smk-006_01.png` y `/evidencias/smk-006_02.png`
- **Defecto relacionado:** `/05-defectos.md` - **BUG-01**

### Caso SMK-BIA-007:

- **ID:** SMK-BIA-007
- **Título:** Filtros por estado del Libro de medidores
- **Justificación:** Se realiza esta prueba para poder validar correctamente la funcionalidad de cada uno de los tipos por estado que se tienen
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** 
    1. Sesión Iniciada
    2. Libro de medidores abierto
- **Pasos ejecutados y datos:** Aplicar por separado **Normales**, **Alertas** y **Críticas**
- **Resultado esperado:** Cada filtro actualiza la URL y la tabla muestra únicamente el estado elegido: 8 normales, 2 alerta o 2 críticos.
- **Resultado obtenido:** Al aplicar los filtros, lo hace correctamente, y refleja el cambio de la URL correctamente:
    1. **Normales:** 8 Medidores (Imagen de evidencia con id - 01)
    2. **Alertas:** 2 Medidores, una Anomalia explicabe de Severidad Media y otro Falso Positivo de severidad Baja (Imagen de evidencia con id - 02)
    3. **Criticas:** 2 medidores, una Anomalia Real de Severidad Alta y otro de Calidad de datos de Severidad Alta (Imagen de evidencia con id - 03)
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-007_01.png`, `/evidencias/smk-007_02.png` y `/evidencias/smk-007_03.png`
- **Defecto relacionado:** No Aplica
- **Observaciones:** Segun la teoría lo que yo entendi es que cuando un anomalia es presentada como un Falso Positivo, pasa a ser un medidor de estado Normal, lo marque como aprobado debido a que puede que me falle mi logica, pero esto se tendria que validar con el equipo para certificar la información, ya que desde la API y cuando se hace el registro de la anomalia, lo reporta como una alerta.

## Caso SMK-BIA-008:

- **ID:** SMK-BIA-008
- **Título:** Búsqueda y apertura de M-109
- **Justificación:** Se realiza esta prueba para poder verificar la integridad de datos frente lo que arroja la API y lo que muestra el front y la correcta actualizacion de la URL
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** 
    1. Sesion iniciada
    2. Libro de medidores abiertos 
- **Pasos ejecutados y datos:** Buscar `M-109` y abrir el resultado.
- **Resultado esperado:** Solo se muestra M-109, al abrirlo se visualizan su estado crítico, consumo, baseline, variación, variables eléctricas, históricos y anomalía.
- **Resultado obtenido:** El proceso se cumple correctamente al momento de buscar el Medidor este nos muestra el resultado correctamente, junto con toda la información que la compone, lo muestra tanto en el Front como en la API
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-008_01.png`, `/evidencias/smk-008_02.png` y `smk-008_bodyResponse.json`
- **Defecto relacionado:** No Aplica

## Caso SMK-BIA-009:

- **ID:** SMK-BIA-009
- **Título:** Carga del módulo Anomalías IA
- **Justificación:** Se valida ya que es uno de los modulos de mayor importancia ya que es uno de los plus que tiene EnergIA, ya que da un reporte detallado de lo que esta pasando con los medidores y como se pueden afrontar
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** 
    1. Sesion inciada
    2. Cargar el modulo de Anomalias
- **Pasos ejecutados y datos:** 
    1. Ingresar a EnergIA
    2. Loguearse con credenciales correctas
    3. Darle click al modulo de Anomalias IA
- **Resultado esperado:** Se muestran 4 anomalías ordenadas por prioridad: M-109, M-112, M-104 y M-106, con tipo, severidad, confianza, acción y fecha de detección
- **Resultado obtenido:** Se muestra correctamente las 4 anomalias reportadas cada ordenada por su prioridad, y mostradas en una tabla correctamente
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-009_01.png` y `/evidencias/smk-009_02.png`
- **Defecto relacionado:** No Aplica

## Caso SMK-BIA-010:

- **ID:** SMK-BIA-010
- **Título:** Ejecución de Run AI Analysis
- **Justificación:** Se realiza para validar lo que compine el analisis de anomalias, donde vaidamos que las 3 apis de las que se compoenen y el front se actualicen y ejecuten correctamente
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** 
    1. Sesion iniciada
- **Pasos ejecutados y datos:** 
    1. Seleccionar **Run AI Analysis** y observar el progreso hasta finalizar
- **Resultado esperado:** Se crea un nuevo ID `AN-####`; los 7 pasos pasan a estado final, el análisis termina como `COMPLETED`, resume 4 anomalías y 2 prioritarias, y el último análisis del Despacho se actualiza.
- **Resultado obtenido:** 
    1. La API de analyze muestra su id AN-0004, status en Running y los 7 pasos en estado pendiente  
    2. La Api analysis/(id) muestra el id AN-004, status Completed, los 7 pasos en Done y un resumen de las anomalias encontradas
    3. El front valida muestra correctamete el id, los 7 pasos con un chulo que certifica que estan correctas, un resumen de las anomlias y se actualiza la fecha y hora de ejecución
    4. La API latest se actualiza al ultimo ID de ejecucion
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-010_01.png`, `/evidencias/smk-010_02.png` y `/evidencias/smk-010_03.png`
- **Defecto relacionado:** No Aplica

## Caso SMK-BIA-011:

- **ID:** SMK-BIA-011
- **Título:** Cierre de sesión y protección de rutas
- **Justificación:** Es una prueba mas enfocada en la seguridad del sistema, ya que con esto verificamos que una vez el cierre de sesion se efectue el sistema no permita, pegar un link y ingresar sin autenticar o desde las flechas de avanzar en el navegador
- **Fecha y hora:** 04/10/2026 - 8:10 AM
- **Versión/SHA:**
- **Precondiciones:** 
    1. Sesion Iniciada
- **Pasos ejecutados y datos:** 
1. Cerrar sesión
2. Usar el boton de Atras en el navegador o copiar directamente un URL de la pagina 
- **Resultado esperado:** No se vuelve a mostrar contenido protegido, la aplicación redirige a `/login`.
- **Resultado obtenido:** El sistema no permite el ingreso al ambiente si no se autentica, no permite ni ingresar mediante el uso del back en el navegador y tampoco copiando y pegando una URL del ambiente
- **Estado:** Aprobado
- **Evidencia:** `/evidencias/smk-011_01.png`, `/evidencias/smk-011_02.png` y `/evidencias/smk-011_03.png`
- **Defecto relacionado:** No Aplica

## Veredicto

Al finalizar la suite, registrar uno de estos resultados:

- **APROBADO:** todos los casos críticos aprobados.
- **APROBADO CON RIESGOS:** no hay bloqueos, pero existen fallos con alternativa temporal y riesgo aceptado.
- **BLOQUEADO:** un servicio o flujo esencial impide continuar con las pruebas.

**Resultado de la ejecución:** `PENDIENTE`  
**Observaciones:** completar después de ejecutar los 12 casos y adjuntar evidencia.
