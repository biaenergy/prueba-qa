# Defectos

## BUG-01

- **ID:** BUG-01
- **Título:** Error de visualización de Medidores
- **Entorno:** 
    1. **SO:** Windows 10
    2. **Navegador:** Chrome (Versión 154.0.8037.98)
- **Pasos:** 
    1. Ingresar a EnergIA, con credenciales correctas
    2. Dirigirse al modulo de Medidores
- **Resultado espeperado:** El sistema debera de permitir que al momento de tener mas de 10 registros tenga la opcion habilitada de ver las paginas siguientes, y ver el flatante de la información
- **Resultado actual:** El boton **Siguiente** no esta habilitado, por ende no se puede ver la información de los otros dos medidores, la unica forma es filtrar por el Estado o Haciendo una busqueda por numero de medidor (pero ahi esta el problema si yo como usuario no me se todos los ids de los medidores, como voy a filtrar)
- **Severidad:** Media
- **Prioridad:** Baja
- **Evidencias:** `/evidencias/smk-bug-001.png`

## BUG-02

- **ID:** BUG-02
- **Título:** JWT malformado, vencido o firmado con otro secreto
- **Entorno:** 
    1. **SO:** Windows 10
    2. **Navegador:** Chrome (Versión 154.0.8037.98)
- **Pasos:** 
    1. Ingresar al http://localhost:8080/docs
    2. Solicitar un token con el cual se va a autenticar
    3. Solicitar otro Token, y no cambiar el que se tenia previamente
    4. Ejecutar cualquier petición
- **Resultado espeperado:** El backend no permitira realizar peticiones si el ultimo token generado no es el mismo que esta autorizado
- **Resultado actual:** El backend permite autorizar un token antiguo al de generación
- **Severidad:** Alta
- **Prioridad:** Alta
- **Evidencias:** `/evidencias/bb-bug-004-01.png`, `/evidencias/bb-bug-004-02.png` y `/evidencias/bb-bug-004-03.png`

## BUG-03

- **ID:** BUG-03
- **Título:** Búsqueda parcial e insensible a mayúsculas
- **Entorno:** 
    1. **SO:** Windows 10
    2. **Navegador:** Chrome (Versión 154.0.8037.98)
- **Pasos:** 
    1. Loguearse en el sistema http://localhost:5173/login
    2. Ingresar a la seccionde Medidores
    3. Digitar en el apartado de busqueda por medidores y ingresar **m-1** o **m-109**
- **Resultado espeperado:** La búsqueda ignora mayúsculas/minúsculas y permite realizar la busqueda de igual manera ya que corresponden al mismo Medidor o medidores
- **Resultado actual:** Esta discriminando por mayusculas y minusculas como si fuera un medidor diferente la sencibilidad esta como M-109 != m-109
- **Severidad:** Media
- **Prioridad:** Media
- **Evidencias:** `/evidencias/bb-bug-005-01.png`

## BUG-04

- **ID:** BUG-03
- **Título:** Ciclo de Run AI Analysis y control de concurrencia
- **Entorno:** 
    1. **SO:** Windows 10
    2. **Navegador:** Chrome (Versión 154.0.8037.98)
- **Pasos:** 
    1. Loguearse en el sistema http://localhost:5173/login en dos ventanas diferentes
    2. Abrir la consola de inspeccion
    3. Seleccinar la herramienta de Network 
    4. Seleccionar en las condiciones de red 3G, esto con el fin de poder ejecutar las dos ejecuciones en paralelo, y que la prueba sea un poco mas visible
- **Resultado espeperado:** 
    1. La primera solicitud responde `202`
    2. los pasos avanzan `PENDING/RUNNING/DONE`
    3. finaliza `COMPLETED` con 4 anomalías y 2 prioritarias. La segunda solicitud reutiliza el mismo ID con `200` y no crea una ejecución paralela. 
- **Resultado actual:** EL sistema si permite correr dos Analisis desde la misma cuenta en paralelo, segun la documentación esto no debe de pasar, deberia de poder identificar la ejecución que esta corriendo actualmente, pero eso no esta sucediendo
- **Severidad:** Alta
- **Prioridad:** Alta
- **Evidencias:** `/evidencias/bb-bug-video-015-01.mp4`