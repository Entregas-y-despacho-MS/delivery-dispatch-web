# Mapa funcional de Delivery Dispatch Web

Revisión estática del frontend local después de actualizar `develop` a `6fe3c1a` (19-10-2026). Describe las rutas, permisos, acciones visibles, servicios llamados y relaciones entre áreas. No se probaron llamadas contra un backend en ejecución.

## 1. Resumen ejecutivo

La aplicación es un portal React para coordinación y supervisión de entregas. Incluye páginas públicas, autenticación, un panel protegido, una bandeja de pedidos, un tablero operativo, revisión inicial de lotes, fichas de despachos, catálogos, administración parcial y seguimiento público del cliente.

No todas las opciones del menú están terminadas. En particular, mapa de flota, recojos, repartidores, incidencias, reportes, auditoría, mantenimiento y Configuración solo muestran encabezado. No hay un mapa interactivo de flota conectado: Leaflet está instalado, pero no se importa en ninguna página; las coordenadas del despacho son enlaces a Google Maps.

## 2. Arquitectura de ejecución

```mermaid
flowchart TD
  URL[URL del navegador] --> ROUTER[Router y guardas]
  ROUTER --> AUTH{¿Pública o con sesión?}
  AUTH -->|Pública| PUB[Página pública]
  AUTH -->|Panel| SHELL[Layout, menú y cabecera]
  SHELL --> PAGE[Pantalla React]
  PUB --> HOOK[Hook del dominio]
  PAGE --> HOOK
  HOOK --> CACHE[React Query: caché, carga y mutaciones]
  CACHE --> SERVICE[Servicio del dominio]
  SERVICE --> AXIOS[Axios: URL base, token, renovación y errores]
  SERVICE --> PUBLIC[Cliente HTTP público]
  AXIOS --> API[Backend REST]
  PUBLIC --> API
  API --> CACHE
  API -. eventos Socket.IO .-> BOARD[Tablero Kanban]
```

- `src/app/router.tsx` declara las rutas públicas, autenticadas y del panel.
- `src/config/portal-routes.ts` es el registro de rutas del panel y sus roles; el menú lo filtra con los mismos metadatos.
- `src/domains/*` agrupa tipos, validaciones, componentes, hooks y servicios por dominio.
- `src/shared/lib/base.service.ts` implementa operaciones CRUD comunes para catálogos.
- React Query mantiene caché; las mutaciones invalidan listas y detalles relacionados.
- Axios toma `VITE_API_URL`, añade `Authorization: Bearer`, renueva el access token en un solo flujo compartido y cierra la sesión si la renovación falla.
- El cliente público de seguimiento no usa la sesión del panel. El token de seguimiento es parte de la ruta y la prueba OTP se envía en una cabecera.

## 3. Usuarios y permisos efectivos en el frontend

| Tipo de usuario | Inicio del panel | Rutas/acciones disponibles en el frontend |
|---|---|---|
| Coordinador | Tablero | Tablero, despachos, planificación, recojos (vacío), mapa (vacío), repartidores (vacío), incidencias (vacío), reportes (vacío), catálogos de zonas/niveles/motivos/tipos, consulta de usuarios, auditoría (vacío) y parámetros operativos. |
| Supervisor | Tablero | Tablero, despachos, mapa (vacío), vehículos, mantenimiento (vacío), repartidores (vacío), incidencias (vacío), reportes (vacío), motivos de incidencia/reprogramación y tipos de falla. No tiene la ruta de planificación. |
| Administrador | Usuarios | Usuarios con gestión; Configuración (vacía). Puede consultar usuarios según la ruta del frontend. |
| Root | Tablero | `hasRole` lo acepta en todas las rutas del panel. Las pantallas vacías siguen vacías también para root. |
| Repartidor | No entra al panel web | El login detecta roles que no pertenecen a `ROLES_WEB`, intenta cerrar la sesión y rechaza el acceso. La API reserva sync/GPS para su aplicación móvil. |
| Cliente final | No requiere sesión | Accede al seguimiento con un enlace y token. No es un rol del panel. |

Las guardas del frontend redirigen a login, cambio obligatorio de contraseña o acceso denegado. Son controles de navegación; la autorización real debe ocurrir en el backend.

**Inconsistencia de acceso:** el Kanban deja al supervisor arrastrar una tarjeta para abrir la revisión del lote en `/app/planificacion`, pero esa ruta solo permite coordinador/root. El backend local sí autoriza supervisor en lectura y primera aprobación de lotes. La interfaz web no ofrece al supervisor esa ruta.

## 4. Rutas públicas y autenticación

| Ruta/página | Estado y comportamiento |
|---|---|
| `/` | Plantilla de landing. El texto aún indica que debe reemplazarse. |
| `/seguimiento` | Encabezado “Seguir mi pedido”; no encontré formulario de búsqueda. |
| `/seguimiento/:token` | Seguimiento conectado: obtiene el pedido, muestra resumen y permite las acciones que admita el backend. |
| `/login` | Login conectado; puede pedir TOTP cuando el backend responde que es obligatorio. Rechaza al repartidor en el portal web. |
| `/recuperar-password`, `/forgot-password` | Solicitud de recuperación por correo. |
| `/restablecer-password`, `/reset-password` y variantes con `:token` | Restablecimiento con token. |
| `/cambiar-password` | Cambio de contraseña obligatorio autenticado. |
| `/acceso-denegado` y `*` | Pantalla de denegación y 404. |

La sesión se persiste con Zustand. Hay aviso tras 28 minutos de inactividad y cierre a los 30 minutos. El cierre limpia la sesión y la caché de React Query para evitar mostrar resultados de la sesión anterior. No encontré UI de administración de 2FA (activación, confirmación o desactivación).

## 5. Operación de pedidos y despachos

### 5.1 Bandeja: `/app/despachos`

Lee `GET /pending-orders` y además carga zonas para el filtro. Presenta destinatario, dirección, zona, franja, bultos, peso, volumen, prioridad, SLA y señales de estado.

Acciones implementadas:

- Búsqueda con debounce; filtros por zona, turno y prioridad; paginación y orden del servidor.
- Filtros reflejados en query string para restaurar/compartir el estado de la bandeja.
- Selector “Solo urgentes”, que pide al backend urgentes ordenados por vencimiento del SLA.
- Cambio de prioridad con `PATCH /dispatches/:id/priority`; cambia la caché de inmediato, revierte si falla y vuelve a consultar para aplicar el orden del servidor.
- Bloquea selección cuando el pedido está reservado por otra persona o tiene dirección en revisión.
- Permite marcar filas, pero la selección solo alimenta el contador: no hay botón/servicio de creación de ruta o reserva asociado.

### 5.2 Tablero: `/app/tablero`

Lee `GET /dispatches/kanban` con fecha, zona, conductor y tipo, además de `GET /dispatches/kanban/filters`. Las zonas se obtienen del catálogo.

- Muestra columnas configuradas para operación o logística inversa, tarjetas, conteos y volumen.
- Las tarjetas muestran guía, conductor, vehículo, zona, tipo, franja, prioridad y estados de propuesta/reserva/reintento.
- “Ver ficha” navega al detalle del despacho.
- Arrastrar no modifica el estado. Si el despacho tiene lote y se suelta en una columna habilitada, navega al lote en Planificación.
- Escucha `dispatch.status_changed`, `dispatch.incident_reported`, `dispatch.evidence_registered`, `dispatch.change_requires_attention` y `route.assigned`; agrupa eventos por 500 ms e invalida la consulta Kanban.
- Si Socket.IO no conecta, usa polling cada 15 segundos. No encontré escucha del evento `dispatch.location.updated` en el frontend.

### 5.3 Ficha: `/app/despachos/:id`

Lee `GET /dispatches/:id/detail`. Divide el detalle en general, línea de tiempo, evidencias e incidencias/reprogramaciones. Renueva URLs de evidencia cuando hace falta (según el componente) y presenta coordenadas como enlace externo de Google Maps. No dibuja la ruta ni las posiciones sobre un mapa propio.

### 5.4 Planificación: `/app/planificacion`

Lee `GET /route-batches` y `GET /route-batches/:id`. La pantalla limita la lista a lotes provisionales y proporciona filtros de revisor. Para opciones de reasignación carga vehículos activos y usuarios activos con rol coordinador/supervisor.

Dentro del lote:

- Muestra zona, fecha, vehículo, revisor, pedidos, estado, validación previa y capacidad de peso/volumen/dimensiones.
- Permite marcar pedidos para sacarlos del lote; esa marca es local hasta la aprobación.
- Cambiar vehículo: `PATCH /route-batches/:id/vehicle`, con versión del lote.
- Reasignar revisor: `PATCH /route-batches/:id/reviewer`.
- Aprobar promesas: `POST /route-batches/:id/approve-promises`, enviando versión del lote, versiones de despachos y pedidos a retirar.
- Maneja conflictos de versión/capacidad: avisa y recarga el lote antes de permitir otro intento.
- Tras aprobar, actualiza lote y bandeja; el mensaje de éxito resume aprobados, retirados y resultados de correo.

La interfaz implementa la **primera aprobación**. No conecta la aprobación final del backend ni la orden para iniciar la ruta. La generación del lote aparece como automática del sistema; no encontré en esta web una acción que arme lotes desde la selección de la bandeja.

## 6. Flota y catálogos

| Pantalla | Acciones conectadas | API/relación |
|---|---|---|
| Vehículos `/app/flota` | Listar, buscar, crear y editar; formulario valida datos de vehículo/capacidad. | CRUD `/vehicles`; ruta para supervisor/root. |
| Zonas `/app/catalogos/zonas` | Listar, filtrar, crear/editar y acciones de estado; configura tiempo base. | `/delivery-zones`; coordinador/root. La misma lista alimenta filtros de bandeja y Kanban. |
| Niveles `/app/catalogos/niveles-servicio` | Mantener niveles/atributos de SLA que afectan compromisos y prioridad. | `/service-levels`; coordinador/root. |
| Motivos de incidencia | Buscar/filtrar, crear/editar y activar/desactivar; define si requiere evidencia. | `/incident-reasons`; coordinador, supervisor, driver o root según backend; página del panel solo coordinador/root. |
| Motivos de reprogramación | Filtrar por texto, estado y categoría; editar y activar/desactivar; `affectsSla` es calculado por API. | `/reschedule-reasons`; pantalla coordinador/root. |
| Tipos de falla vehicular | Filtrar por severidad y si bloquea; crear/editar. | `/vehicle-incident-types`; coordinador/supervisor/root. |

Los catálogos reutilizan servicios CRUD, esquemas Zod, formularios y estados de carga/error. Aunque el servicio común puede exponer `getOne` y `delete`, eso no significa que cada pantalla use esas acciones; las pantallas de catálogo operan principalmente desde las filas ya cargadas y usan estado activo/inactivo.

## 7. Usuarios, reportes, configuración y seguimiento

### Usuarios: `/app/usuarios`

Lista paginada con búsqueda, filtros de rol/estado y orden por nombre o último acceso. Admin/root ven acciones para crear, editar, cambiar rol y desactivar; coordinador consulta. La actualización de perfil manda solo campos que cambiaron, para no chocar con unicidad de usuario/correo. Cambiar rol es una mutación aparte. La lista consume `GET /users`, el selector `GET /roles`, y las mutaciones usan `POST /users`, `PUT /users/:id`, `PATCH /users/:id/role`.

### Parámetros: `/app/configuracion/parametros`

Formulario conectado a `GET /settings` y `PUT /settings/:key`. Organiza valores en siete grupos: ventanas; plazo de servicio; planificación; día anterior a salida; día de salida; cliente; entregas. Incluye horas, plazos, horarios de generación, días laborales/feriados, capacidad de planificación, hora de corte/revisión y límites de intentos. Valida tipos y cruces entre valores antes del PUT; el backend vuelve a validar. En los controladores locales, GET permite admin/coordinator y PUT coordinator/root; root pasa la guarda de rol.

### Seguimiento: `/seguimiento/:token`

1. Lee el resumen con `GET /public/tracking/:token`.
2. Confirma entrega con `POST .../confirm` o manda texto de solicitud con `POST .../change-request`.
3. Para reprogramar, solicita código (`POST .../verification-code`), lo verifica (`POST .../verification-code/verify`), consulta franjas (`GET .../slots`) y elige una (`POST .../reschedule`).
4. La prueba de verificación va en `X-Verification-Proof`, solo en memoria y no en URL/storage.
5. El resumen se actualiza en caché después de una acción y vuelve a consultar al recuperar foco de pestaña.

### Rutas existentes, todavía sin funcionalidad conectada

`/app/mapa`, `/app/recojos`, `/app/repartidores`, `/app/incidencias`, `/app/reportes`, `/app/auditoria`, `/app/flota/:id/mantenimiento` y `/app/configuracion` solo renderizan el encabezado/descripción. Hay componentes/hooks/types en algunos dominios, pero sus servicios están vacíos y las páginas no los conectan. No se debe interpretar el contenido de esos directorios como funcionalidad disponible.

## 8. Roles: resumen por persona

| Rol | Puede operar hoy en esta web | Puede entrar, pero la ruta está vacía o limitada |
|---|---|---|
| Coordinador | Tablero, bandeja y prioridad, primera revisión de lotes, catálogos, parámetros, consulta de usuarios, seguimiento público (como cliente si tiene enlace). | Recojos, mapa, repartidores, incidencias, reportes y auditoría vacíos. |
| Supervisor | Tablero, bandeja y prioridad, vehículos, tipos de falla, algunos motivos. | Mapa, mantenimiento, repartidores, incidencias y reportes vacíos; la revisión de lote que el tablero enlaza está bloqueada por permiso de ruta. |
| Administrador | Gestión de cuentas y roles de usuario. | Configuración vacía. No tiene acceso a tablero operativo por el registro de rutas. |
| Root | Todas las rutas según guardas. | No obtiene una implementación distinta para pantallas vacías. |
| Repartidor | Ninguna pantalla de este portal. | El login web lo rechaza; sus flujos son de aplicación móvil/API. |
| Cliente final | Consulta y acciones de autoservicio con token válido. | La ruta de búsqueda sin token está vacía. |

## 9. Capacidades backend no conectadas desde estas pantallas

Según controladores locales/API: sincronización de eventos y evidencias de conductor; envío GPS; auditoría; registro de mantenimiento; aprobación final e inicio de lotes; programación de recojos; administración completa de 2FA. Algunas pertenecen a la aplicación móvil o al backend automático y otras corresponderían a páginas vacías.

## 10. Hallazgos que afectan la lectura del mapa

1. **Mapa:** no hay mapa interactivo de flota, ni consumo de Leaflet, ni página que lea y pinte posiciones. El frontend no escucha `dispatch.location.updated`. Solo hay iconos de ubicación, imagen de fondo y enlaces de coordenadas a Google Maps.
2. **Selección de pedidos:** la tabla permite seleccionar pero no ejecuta creación/asignación de rutas.
3. **Ciclo de planificación:** la web llega a primera aprobación; no expone la aprobación final/inicio de ruta.
4. **Supervisor:** el backend local permite revisión inicial, pero la ruta web de planificación es solo de coordinador.
5. **Configuración:** el formulario real vive en Parámetros (ruta coordinador); la página Configuración de admin está vacía. El controlador local permite GET a admin/coordinator y PUT a coordinator/root; la guía `docs/API.md` describe admin/root para settings. Esta discrepancia entre snapshot y fuente local debe validarse contra el backend desplegado.
6. **Documentación API:** la guía local enumera 53 operaciones y sirve de referencia, pero no incluye varias rutas consumidas por el frontend reciente (lotes, pedidos pendientes, detalle/prioridad, tracking público). Hay que renovar/verificar el snapshot antes de agregar integraciones.

## 11. Límites y base revisada

Revisión de código frontend y documentación local, sin ejecutar pruebas ni enviar peticiones a servicios. El repositorio backend disponible está en una rama de trabajo con modificaciones locales; por eso sus controladores sirven para contrastar estructura, pero no se consideran prueba del backend desplegado. Para implementar o corregir integraciones, confirmar primero el contrato actual del backend y actualizar `docs/openapi.json`/guía si corresponde.
