# Auditoría de tareas Frontend Web — Sprint 2

Fecha de revisión: 19-10-2026. Base revisada: `delivery-dispatch-docs/jira/SPRINT_2.md` y el código local de `delivery-dispatch-web` en `develop` (`6fe3c1a`). Es una revisión estática: no se ejecutaron las pruebas ni se verificó el backend desplegado.

## Resultado

De las 13 subtareas de web (11 identificadas como **Frontend Web** y 2 tareas **Backend/Frontend**) que permanecen en el alcance del Sprint 2:

- **6 cumplidas por código**
- **2 parciales**
- **5 pendientes en la parte web**

Por tanto, **no se cumplieron todas las tareas web del Sprint 2** según el alcance y criterios descritos. La conclusión se refiere al código que existe, no al campo de estado de Jira.

## Matriz tarea por tarea

| Subtarea | Estado en Sprint 2 | Resultado en la web | Evidencia / observación |
|---|---|---|---|
| `ST-48.1` — Bandeja central | Finalizada | **Cumplida** | Bandeja real con tabla, datos de `/pending-orders`, filtros, debounce, orden/paginación, reservas, estados vacío/error y refresco. La prioridad se añadió después. La selección de filas es solo visual y no crea lotes; eso no figura como acción de esta subtarea de tabla. `src/pages/dashboard/despachos-page.tsx`, `src/domains/despachos/hooks/use-bandeja-pedidos.ts`. |
| `ST-215.1` — Revisión y primera aprobación | Por hacer | **Cumplida por código; estado Jira desactualizado** | Lista de lotes provisionales, detalle, pedidos a retirar, validación/capacidad, cambio de vehículo, revisor, confirmación con conteo de correos, aprobación con versiones y recarga ante conflicto. `src/pages/dashboard/planificacion-page.tsx`, `src/domains/planificacion/components/lote-provisional-detalle.tsx`, `src/domains/planificacion/components/aprobar-promesas-dialog.tsx`. |
| `ST-51.1` — Aprobación final | Finalizada | **Pendiente; estado Jira contradice el código** | La página de planificación consulta exclusivamente lotes `provisional`. No hay una pantalla de revisión para `pending_final_review`, ni llamada `POST /route-batches/:id/approve-final`, ni flujo web de aprobar conjuntamente vehículo y conductor. `src/pages/dashboard/planificacion-page.tsx`; no se encontró el endpoint `approve-final` usado desde `src/`. |
| `ST-51.4` — Alertas, recordatorio y escalamiento de aprobación final (Backend/Frontend) | Finalizada | **Pendiente en la parte web** | No encontré una bandeja/centro de avisos del panel ni un consumidor web de eventos de fin de revisión o escalamiento. Los parámetros horarios existen, pero eso no implementa la visualización de alertas al coordinador/supervisor. |
| `ST-52.1` — Modal de reprogramación interna | Por hacer | **Pendiente** | No hay flujo web para que coordinación reprograme una entrega fallida con historial de intentos, evidencia, motivo, límite de intentos y devolución a almacén. `src/domains/despachos/components/reprogramar-dialog.tsx` está vacío y no se usa. La reprogramación pública del cliente (`ST-224.2`) no sustituye esta tarea. |
| `ST-53.1` — Tablero Kanban | Por hacer | **Parcial; estado Jira desactualizado** | Sí existen nueve columnas operativas, cuatro de logística inversa, filtros, tarjetas, contadores, socket y arrastre guiado que abre la revisión. El arrastre no cambia estados, conforme al criterio. La revisión final a la que apunta no está implementada; además, la ruta destino restringe Planificación al coordinador, aunque el tablero también deja actuar al supervisor. El socket no escucha `dispatch.location.updated`. `src/domains/despachos/components/tablero-kanban.tsx`, `src/domains/despachos/tablero-kanban.rules.ts`, `src/domains/despachos/hooks/use-dispatch-events.ts`. |
| `ST-53.2` — Sincronización en vivo (Backend/Frontend) | Por hacer | **Parcial; estado Jira desactualizado** | El hook web conecta Socket.IO con token, reconecta con backoff, invalida la consulta Kanban por eventos y activa polling de 15 s si se desconecta. No escucha todos los eventos enumerados por la subtarea: faltan `dispatch.location.updated`, `integration.message_rejected` e `integration.order_incomplete`. `src/domains/despachos/hooks/use-dispatch-events.ts`, `src/domains/despachos/hooks/use-tablero-kanban.ts`. |
| `ST-55.1` — Historial de despachos | Por hacer | **Pendiente** | No hay ruta ni página de historial con filtros por fechas/conductor/vehículo/estado, paginación del servidor o exportación. `src/pages/dashboard/reportes-page.tsx` no es el historial y solo muestra otro encabezado; no se encontró servicio de historial. |
| `ST-56.1` — Ficha 360° | Por hacer | **Cumplida por código; estado Jira desactualizado** | Ficha con secciones general, línea de tiempo, evidencias e incidencias/reprogramaciones; coordenadas, receptor, visor y renovación de evidencia. `src/pages/dashboard/despacho-detalle-page.tsx`, `src/domains/despachos/components/despacho-ficha.tsx`, `src/domains/despachos/components/evidencia-visor.tsx`. |
| `ST-57.1` — Parámetros operativos | Finalizada | **Cumplida** | Formulario conectado a settings, grupos, validación individual y cruzada, marcas de valor propuesto/sin definir, guardado solo de claves modificadas y actualización de caché. `src/pages/dashboard/parametros-page.tsx`, `src/domains/configuracion/configuracion.grupos.ts`, `src/domains/configuracion/configuracion.reglas.ts`. |
| `ST-58.1` — Insignias y filtros de prioridad | Finalizada | **Cumplida** | Prioridad editable desde la bandeja, filtros y selector de urgentes, actualización optimista, reversión ante error y orden recargado desde servidor; badges en Kanban y bandeja. `src/domains/despachos/components/prioridad-selector.tsx`, `src/domains/despachos/despachos.prioridad.ts`, `src/domains/despachos/hooks/use-bandeja-pedidos.ts`. |
| `ST-224.2` — Seguimiento público y reprogramación del cliente | Por hacer | **Cumplida por código; estado Jira desactualizado** | Página por token sin login, resumen, confirmar, solicitar cambio, pedir/verificar código, listar franjas y reprogramar; maneja errores del flujo. `src/pages/public/seguimiento-detalle.tsx`, `src/domains/seguimiento/components/seguimiento-publico-vista.tsx`, `src/domains/seguimiento/services/tracking-publico.service.ts`. |
| `ST-224.3` — Bandeja de solicitudes del cliente | Por hacer | **Pendiente** | El cliente puede enviar una solicitud, pero no existe pantalla de coordinación para listar solicitudes, ver su texto y resolverlas, ni servicio web correspondiente. `src/domains/seguimiento/` solo gestiona la vista pública. |

## Tareas movidas fuera del Sprint 2

No se cuentan como incumplimientos del Sprint 2 porque el documento las mueve explícitamente al Sprint 3:

| Subtarea | Alcance posterior | Situación visible en la web actual |
|---|---|---|
| `ST-54.1` — Reportes de cumplimiento SLA | Sprint 3 | La ruta de reportes muestra solo el encabezado. |
| `ST-81.1` — Programar recojos domiciliarios | Sprint 3 | La ruta de recojos muestra solo el encabezado. |

## Diferencias entre el documento y el código

El campo **Estado** del documento no representa consistentemente lo que está en esta rama:

- `ST-215.1`, `ST-53.1`, `ST-53.2` y `ST-224.2` dicen «Por hacer», pero parte o toda su funcionalidad sí aparece en el frontend.
- `ST-56.1` dice «Por hacer», pero la ficha 360° sí aparece implementada.
- `ST-51.1` dice «Finalizada», pero no existe la aprobación final en la web.
- `ST-48.1`, `ST-57.1` y `ST-58.1` dicen «Finalizada» y su funcionalidad principal sí está en el código.
- `ST-51.4`, `ST-52.1`, `ST-55.1` y `ST-224.3` dicen «Por hacer»/«Finalizada» y no encontré la función web correspondiente. `ST-51.4` y `ST-51.1` aparecen «Finalizada», pero les falta su parte web.

## Criterio de clasificación

- **Cumplida:** los principales criterios de aceptación de la subtarea están representados por una pantalla, acciones y servicios conectados en el código local.
- **Parcial:** la pantalla existe, pero falta una pieza importante de aceptación o el destino de un flujo no está disponible para todos los roles previstos.
- **Pendiente:** no hay pantalla/flujo conectado que implemente el objetivo de la subtarea.

Esta clasificación no certifica calidad de ejecución, integración con datos reales ni aprobación de Jira. Para eso habría que correr las pruebas descritas por las subtareas y validar contra el backend desplegado.

## Cobertura de criterios y límites de la revisión

La revisión recorrió las 13 filas web identificadas directamente en el Sprint 2 y contrastó sus criterios con el router, los permisos del portal, las páginas, los componentes, hooks, servicios y tipos de `src/`. Las subtareas móviles y puramente backend no se califican como frontend web. Las dos filas compartidas se califican únicamente por su parte que afecta a la web.

| Subtarea | Qué sí queda cubierto | Qué no queda cubierto o no se pudo confirmar estáticamente |
|---|---|---|
| `ST-48.1` | Columnas, orden remoto, filtros, búsqueda con debounce, badges, filas no seleccionables, carga/vacío/error y refresco; respeta separación por dominios. | Las filas seleccionables no disparan ninguna operación: no se crea ni reserva un lote desde la selección. La subtarea no define esa operación como criterio propio, así que queda registrada como brecha de flujo general, no como motivo para bajar su resultado. No se corrieron typecheck/lint ni pruebas. |
| `ST-215.1` | Lista provisional, detalle, diferencia propuesta/reservada, sacar pedido, cambiar vehículo, reasignar revisor, confirmar cantidad de correos y recuperación ante conflicto. | La prueba de componentes solicitada no se ejecutó en esta revisión. |
| `ST-51.1` | Ningún flujo de segunda aprobación visible en el frontend. | Falta toda la pantalla de lotes `pending_final_review`, su validación/corrección, confirmación conjunta, bloqueo por capacidad, reloj de revisión y manejo contextual de conflicto. Jira la da por finalizada, pero no está en esta web. |
| `ST-51.4` (parte web) | La web configura algunos horarios operativos en Parámetros. | No hay notificación web para coordinadores/supervisor al terminar o escalar la revisión, ni bandeja de alertas que muestre los casos. Los horarios por sí solos no cumplen esos criterios. No se evaluó el envío automático de correo del backend. |
| `ST-52.1` | La ficha 360 muestra historial de incidencias/reprogramaciones; el cliente tiene autoservicio separado. | No hay modal de reprogramación interna: faltan elegir fecha/franja/motivo, contar intentos, mostrar evidencia previa, bloquear el límite y ofrecer devolución a almacén. |
| `ST-53.1` | Columnas, filtros, tarjetas, contadores, logística inversa y arrastre que no muta estado; la tarjeta enlaza a ficha y el arrastre navega a revisión si tiene lote. | La navegación no puede completar la revisión final porque `ST-51.1` falta; la ruta de planificación solo admite coordinador/root aunque el tablero también se habilita a supervisor. |
| `ST-53.2` (parte web) | Socket con token, eventos operativos principales, reconexión con backoff, invalidación agrupada y polling de respaldo cada 15 segundos desconectado. | Faltan listeners web para `dispatch.location.updated`, `integration.message_rejected` e `integration.order_incomplete`. El test de integración que prueba entrega/no entrega de eventos no se ejecutó; el envío/backend no se certifica aquí. |
| `ST-55.1` | Ninguna tabla web de historial conectada. | Faltan filtros combinados persistidos en URL, paginación server-side, CSV, columnas de historial y navegación desde cada fila a ficha. Reportes no sustituye historial. |
| `ST-56.1` | Pestañas de datos generales, línea de tiempo, evidencias y eventos/reprogramaciones; GPS enlazado, receptor, zoom, metadatos y renovación de URL vencida; estados vacíos y carga/error. | Las coordenadas abren un mapa externo; no hay mapa embebido. Las pruebas de pestañas/visor/renovación no se ejecutaron. |
| `ST-57.1` | Siete grupos de parámetros, omisión de ventana express, carga/guardado, validaciones individuales/cruzadas, feedback y marcas de valores propuestos. | No se ejecutó la suite pedida ni se verificó el servicio real contra backend desplegado. |
| `ST-58.1` | Badges, edición rápida, filtros de zona/prioridad/turno, solo urgentes y orden por vencimiento; URL, actualización optimista y reversión en error. | No se ejecutaron las pruebas de éxito/conflicto requeridas. |
| `ST-224.2` | Página pública por token, confirmar, solicitud de cambio, OTP por correo, consulta/selección de franjas, errores y sin franjas. | No se ejecutaron las pruebas de estados y verificación OTP ni se verificó entrega real de correo/backend. |
| `ST-224.3` | Ninguna bandeja interna de solicitudes. | Falta listar solicitudes, mostrar el texto, resolverlas por reprogramación y compartir enlace alternativo a clientes sin correo. |

## Alcance de Sprint 2 frente a la web completa

La auditoría contesta qué subtareas de Sprint 2 que afectan al frontend aparecen implementadas. No significa que todas las demás rutas del portal estén terminadas. El inventario amplio de las páginas/roles y conexiones actuales está en `docs/WEB-FUNCTIONAL-MAP.md`; por ejemplo, la búsqueda pública sin token, el mapa de flota, reportes, recojos, incidencias, repartidores, auditoría, mantenimiento y Configuración son pantallas sin flujo conectado en esta rama. `ST-54.1` y `ST-81.1` están fuera del Sprint 2 porque el propio documento las mueve al Sprint 3.
