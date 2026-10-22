# Plan de pruebas — EnergIA

## 1. Objetivo

Validar que la plataforma EnergIA permita a un operador autenticarse, consultar los medidores eléctricos, identificar las anomalías relevantes y comprender su prioridad, evidencia y acción recomendada.

Las pruebas buscarán verificar tanto el funcionamiento de la interfaz y la API como la consistencia de la información presentada entre ambas capas y la documentación del producto.

**Versión evaluada:** `[SHA del commit o versión]`  
**Fecha de ejecución:** `03/10/2026`  
**Responsable:** `Juan David Bastidas Laguna`  
**Entorno:** `Windows, Chrome (154.0.8037.93)`  
**Zona horaria:** `America/Bogota`

## 2. Alcance

### Incluido

Se probarán las siguientes funcionalidades:

- Inicio y cierre de sesión - Donde incluiremos una prueba de Gestión de Sesión.
- Protección de rutas y endpoints mediante JWT.
- Dashboard o Despacho.
- Libro de medidores.
- Búsqueda, filtros, ordenamiento y paginación.
- Detalle de un medidor.
- Listado e investigación de anomalías.
- Ejecución de Run AI Analysis y seguimiento de sus pasos.
- Reglas principales de clasificación, severidad y prioridad.
- Consistencia entre documentación, API e interfaz.
- Validaciones y manejo de errores.
- Formato regional de cifras y fechas.
- Navegación básica mediante teclado y comunicación accesible de estados.
- Pruebas automatizadas del flujo principal con Playwright.

### Fuera de alcance

No se realizarán pruebas exhaustivas de:

- Rendimiento, estrés o concurrencia a gran escala, porque el alcance corresponde a un MVP con un dataset fijo.
- Seguridad especializada, como pentesting o análisis profundo de vulnerabilidades.
- Precisión lingüística del contenido generado por OpenAI en múltiples ejecuciones.
- Compatibilidad con todos los navegadores, sistemas operativos y dispositivos.
- Validación física de los medidores o de las lecturas eléctricas.
- Despliegue y comportamiento en infraestructura de producción.
- Rate limiting debido a que tenemos un Dataset fijo, no podremos revisar como se comporta el sistema al momento de que un usuario ejecute N cantidad de acciones por un tiempo determinado

Estas áreas podrán mencionarse como riesgos residuales.

## 3. Enfoque basado en riesgos

Las pruebas se priorizarán según el impacto que tendría un fallo sobre la decisión del operador.

| Prioridad | Área | Riesgo principal | Impacto |
|---|---|---|---|
| Alta | Clasificación y priorización | Una anomalía real podría mostrarse como normal o recibir una prioridad incorrecta | El operador podría ignorar un problema crítico |
| Alta | Consistencia API–UI | La interfaz podría mostrar valores diferentes de los calculados por el backend | Decisiones basadas en información incorrecta |
| Alta | Autenticación y autorización | Un usuario no autenticado podría acceder a información protegida | Exposición de información operacional |
| Media | Filtros, orden y paginación | El operador podría no encontrar un medidor o interpretar mal el listado | Retraso en la investigación |
| Media | Run AI Analysis | El análisis podría quedar incompleto, duplicarse o mostrar un estado incorrecto | Resultados desactualizados o confusos |
| Media | Fechas y formato regional | Las horas podrían convertirse incorrectamente o las cifras resultar ambiguas | Interpretación equivocada de la ventana de una anomalía |
| Baja | Presentación visual | Problemas responsive, de contraste o de navegación por teclado | Dificultad de uso y accesibilidad |

Los primeros casos ejecutados cubrirán autenticación, disponibilidad del sistema, M-109, M-112 y la consistencia de las cuatro anomalías esperadas.

## 4. Tipos y niveles de prueba

### Pruebas de humo

Se realizaran pruebas donde comprobaremos funcionalidades importantes de la plataforma, como el analisis de las anomalias, se validara que podramos ingresar a pantallas principales, la idea es que el ambiente este apto para realizar pruebas

### Pruebas funcionales de caja negra

Se validará el comportamiento del sistema desde la perspectiva del usuario y de la API, aplicando particiones de equivalencia y valores límite en login, filtros y paginación. También se comprobarán las reglas de clasificación, estado, severidad y prioridad mediante tablas de decisión, junto con escenarios negativos y entradas inválidas. Finalmente, se verificará que la información de la documentación, la API y la interfaz sea consistente.

Técnicas previstas:

- Partición de equivalencia para credenciales, estados y filtros.
- Valores límite para paginación y tamaños de página.
- Tablas de decisión para tipo de anomalía, severidad, estado y prioridad.
- Pruebas negativas con parámetros inválidos, tokens incorrectos y recursos inexistentes.
- Comparación entre los resultados de la API, la interfaz y la documentación.

### Pruebas de caja blanca

Se revisarán los siguientes modulos:

1. Motor de análisis y clasificación de anomalías.
2. `[Autenticación y JWT / filtros y paginación / Run AI Analysis]`.

Se analizarán condiciones, ramas, validaciones y casos borde. También se evaluará la cobertura y utilidad de los tests existentes, identificando casos faltantes.

### Pruebas de integración

Se verificará la comunicación entre los principales componentes de la plataforma, especialmente:

- El envío de credenciales desde la interfaz y la recepción y utilización del token JWT.
- La correspondencia entre las respuestas de la API y los datos mostrados en la interfaz.
- La integración entre los endpoints y el motor de análisis de anomalías.
- El inicio de Run AI Analysis y la actualización de sus pasos mediante consultas periódicas.
- La carga y procesamiento de los archivos CSV por parte del backend.
- La consistencia de un mismo medidor entre el dashboard, el listado, el detalle y el módulo de anomalías.

### Automatización

Se automatizará con Playwright:

- Un flujo completo de negocio: Login - Ejecutar el Boton de Run AI Analysis - Certificar la ultima ejecución extrayendo la información del front Y en la sección de Anomalias IA validar los resultados que arroja el sistema
- Un test que reproduzca un defecto identificado.

## 5. Datos y oráculos de prueba

Los resultados esperados se tomarán de:

- `README.md`.
- `PRUEBA_QA.md`.
- `backend/README.md`.
- `frontend/README.md`.
- `frontend/PRODUCT.md`.
- Swagger/OpenAPI.
- Reglas de negocio documentadas.

El dataset contiene 12 medidores y se esperan cuatro anomalías principales:

- M-109: anomalía real, severidad alta y prioridad 1.
- M-112: problema de calidad de datos, severidad alta y prioridad 2.
- M-104: anomalía explicable, severidad media y prioridad 3.
- M-106: falso positivo, severidad baja y prioridad 4.

Los demás medidores deberían permanecer en estado normal.

## 6. Entorno y herramientas

- Backend: Go, puerto `8080`.
- Frontend: React, puerto `5173 en desarrollo`.
- Navegador principal: `Chrome`.
- Herramientas: `Playwright`, `Postman`, `Swagger`, `VS code`, `DevTools`, `ChatGPT - WORK y CLI`.
- Zona horaria: `America/Bogota`.
- Credenciales de prueba: usuario de demostración suministrado por el proyecto.

## 7. Criterios de entrada

Las pruebas podrán comenzar cuando:

- El repositorio y la versión a evaluar estén identificados.
- Backend y frontend puedan iniciarse.
- `/health` responda correctamente.
- El dataset esté disponible.
- Las credenciales permitan acceder al sistema.
- La documentación y Swagger estén disponibles.

Si alguna condición no se cumple, se registrará como bloqueo o hallazgo y se continuará con las pruebas que no dependan de ella.

## 8. Criterios de salida

La ejecución se considerará completa cuando:

- La suite de humo haya sido ejecutada.
- Los casos críticos y de alta prioridad tengan resultado registrado.
- Se hayan ejecutado entre 15 y 25 casos funcionales.
- Se hayan revisado al menos dos módulos mediante caja blanca.
- Se hayan reportado al menos dos defectos con evidencia.
- Los tests obligatorios de Playwright estén implementados y documentados.
- Los riesgos abiertos y pruebas no ejecutadas estén identificados.
- Exista una decisión explícita sobre la liberación del build.

## 9. Entregables

- Plan de pruebas.
- Resultados de smoke.
- Casos de caja negra.
- Análisis de caja blanca.
- Reportes de defectos y evidencias.
- Proyecto Playwright.
- Resumen ejecutivo.
- Video de presentación (https://drive.google.com/file/d/1xwpAlNdNZ4qgwTXr49C5-sQxzX7fIEvp/view?usp=sharing).

## 10. Resumen Ejecutivo

Al finalizar el proceso de pruebas se identificaron cuatro defectos: dos de severidad media y dos de severidad alta.

Con base en los resultados obtenidos, no se recomienda desplegar esta versión en producción. Aunque los defectos de severidad media no bloquean completamente la operación, afectan la navegación y la experiencia del usuario dentro de la plataforma.

Los defectos de severidad alta representan un riesgo mayor. En particular, el BUG-02 permite continuar realizando peticiones a los endpoints protegidos de la API con un token anterior, incluso después de generar uno nuevo. Este comportamiento evidencia una debilidad en la gestión de sesiones y podría permitir accesos que deberían haber sido invalidados.

Por lo anterior, la decisión de liberación es NO APROBADA. Se recomienda corregir primero los defectos de severidad alta, validar nuevamente la autenticación y la gestión de sesiones, y ejecutar las pruebas de regresión correspondientes antes de considerar un despliegue. Los defectos de severidad media también deberían corregirse para asegurar una navegación consistente y una experiencia adecuada para el usuario.