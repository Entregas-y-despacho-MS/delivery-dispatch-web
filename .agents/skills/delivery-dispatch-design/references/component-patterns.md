# Patrones de componentes y pantallas

## Estructura de la aplicación

### Sidebar

- Escritorio: usa los anchos que ya define la primitiva `src/shared/components/ui/sidebar.tsx` (`SIDEBAR_WIDTH`, `SIDEBAR_WIDTH_ICON`, `SIDEBAR_WIDTH_MOBILE`). No fijes anchos propios ni los dupliques en el layout.
- Agrupa rutas por tarea: Operación, Flota, Control, Catálogos y Administración.
- Cada elemento lleva un icono Lucide y una etiqueta. El activo usa un fondo de selección y contraste claro; no depende de una línea lateral diminuta.
- Muestra contadores solo si requieren atención o aportan una decisión. No repitas el perfil si ya está en la barra superior.
- Móvil: usa un drawer accesible con botón de menú, foco administrado y cierre al navegar.

### Navbar

- Altura aproximada de 56–64 px y posición estable durante el scroll.
- Izquierda: control del sidebar y breadcrumb o contexto actual.
- Derecha: acciones globales que realmente existan, tema, notificaciones si son funcionales y un único acceso al perfil.
- La búsqueda global solo aparece cuando busca en varias áreas. La búsqueda de un listado pertenece a su toolbar.

### Contenido

- Un solo `PageHeader` por pantalla: eyebrow opcional, título, descripción útil y una acción principal.
- Ancho máximo de `max-w-7xl` para listados, formularios y detalle. Mapa, tablero y tablas de comparación pueden ocupar todo el ancho disponible.
- Coloca métricas únicamente cuando ayudan a decidir en esa pantalla. Prefiere una banda compacta a una colección de tarjetas decorativas.

## Listados y tablas

Orden recomendado:

1. Encabezado y acción principal.
2. Métricas útiles, si existen.
3. Filtros por estado o segmento.
4. Búsqueda y filtros adicionales.
5. Tabla, estado vacío o error.
6. Total y paginación.

Reglas:

- Mantén entre cuatro y seis columnas conceptuales en escritorio.
- Agrupa identificador con cliente, destino con repartidor y estado con hora cuando esa relación acelere el escaneo.
- Usa encabezados en sentence case y alinea números a la derecha.
- La fila completa puede ser interactiva solo si los controles internos siguen siendo accesibles. Una acción de detalle explícita siempre es válida.
- Las acciones infrecuentes viven en un menú contextual. No muestres una fila de iconos sin etiqueta.
- Usa paginación con total visible, no scroll infinito: en operaciones hay que poder citar y volver a una página concreta.
- Carga: skeletons con la forma de la tabla. En una recarga de datos ya visibles no sustituyas la tabla por skeletons; marca la zona como ocupada y conserva el contenido.
- Lista vacía: explica cómo crear el primer registro.
- Sin resultados: conserva filtros visibles y permite limpiarlos.
- Error: mensaje cercano con una acción de reintento cuando tenga sentido.
- Móvil: convierte cada fila en una composición vertical que preserve identificador, cliente, destino, estado y acceso al detalle. Evita scroll horizontal salvo que comparar columnas sea la tarea principal.

## Formularios

- Usa página completa para creación, edición o flujos con varias secciones. Usa dialog para tareas cortas de hasta unos pocos campos; sheet para edición contextual que deba conservar la referencia visual.
- Agrupa campos por significado, no por tamaño visual. Cada sección tiene título y, si aporta información, una frase breve.
- Una columna en móvil. Dos columnas en escritorio solo para campos relacionados.
- Dimensiona el ancho del campo según el dato esperado. No estires un campo corto solo para completar la fila.
- Coloca label visible encima del control. Todos los campos se consideran obligatorios salvo los que muestran `Opcional` junto al label.
- La ayuda preventiva aparece debajo del control. El error reemplaza o sigue a la ayuda y explica la corrección.
- Usa `aria-invalid`, `aria-describedby` y foco en el primer campo inválido al enviar.
- Declara siempre `autoComplete` y el teclado correcto en móvil (`inputMode`, `type`): el formulario debe poder completarse con el gestor de contraseñas y con una sola mano.
- Mantén `Cancelar` como acción secundaria y `Guardar`, `Crear` o la acción específica como primaria.
- Si hay riesgo de perder cambios, avisa antes de abandonar.
- Después de guardar, confirma el resultado y navega al listado o detalle previsto por el flujo.
- Un resumen lateral es útil cuando el formulario configura una entidad compleja; se oculta o se integra al flujo en móvil.

### Placeholder

El placeholder ayuda a entender qué se espera y se usa con normalidad en los formularios de la aplicación. Acompaña al label, nunca lo sustituye: el label permanece visible mientras se escribe.

- Escribe un ejemplo real y breve del dato, no una instrucción: `Av. Banzer 3er anillo`, `000000`, `ABC-123`, `70000000`.
- Un placeholder por campo, en la misma voz que el resto de la interfaz y sin punto final.
- No lo uses para marcar obligatoriedad ni para esconder ahí la única explicación del campo: lo que el usuario deba recordar mientras escribe va en la ayuda bajo el control.
- En selects, el primer estado es una indicación de elección (`Selecciona una zona`), no un valor válido.

### Iconos en los campos

Los campos pueden llevar icono cuando ayuda a reconocer el dato de un vistazo: usuario, correo, teléfono, fecha, ubicación, búsqueda, importe.

- Un icono por lado como máximo, de 16 px, en `muted-foreground`, alineado al centro vertical del control.
- Reserva su espacio con padding en el input (`pl-10` o `pr-11` según el lado). El icono nunca se superpone al texto escrito.
- Si es decorativo, lleva `aria-hidden`. Si es un control —mostrar contraseña, limpiar, abrir calendario— es un `button` real con `aria-label`, objetivo de 44 px y el anillo de foco estándar de la aplicación.
- Mantén el mismo icono para el mismo dato en todas las pantallas.
- Un campo con error no cambia de icono: el error se comunica con el borde, el texto y `aria-invalid`.

### Momento de la validación

- Valida al salir del campo, no en cada tecla: un error que aparece mientras el usuario todavía escribe es ruido.
- Una vez que un campo mostró error, revalídalo en cada cambio para que la corrección se confirme sola.
- En React Hook Form esto es `mode: "onTouched"` y `reValidateMode: "onChange"`.
- El error que devuelve el servidor se muestra junto al campo que lo causó; si no corresponde a ningún campo, sobre el formulario.

## Feedback y confirmaciones

- Toast: confirma algo que ya terminó y no requiere acción (`Despacho creado`). Una línea, sin errores accionables dentro.
- Inline: todo lo que el usuario deba corregir, decidir o reintentar, junto a lo que lo causó. Un error que se cierra solo es un error perdido.
- Una acción destructiva se confirma en un dialog que dice qué se elimina, a qué afecta y si puede deshacerse. El botón primario nombra el verbo (`Eliminar zona`), nunca `Aceptar`.
- No uses un spinner a pantalla completa después del primer render: el progreso se muestra en la zona que cambia.

## Datos en vivo

El tablero y el mapa se actualizan solos. La pantalla no debe moverse bajo el cursor.

- No reordenes ni insertes filas mientras el usuario lee. Acumula y ofrece `3 despachos nuevos` como acción explícita.
- Resalta brevemente lo que cambió en una fila visible; no animes la lista entera.
- Muestra cuándo fue la última actualización y avisa si la conexión se perdió.
- Una actualización nunca descarta lo que el usuario escribió, filtró o seleccionó.

## Permisos en la interfaz

- Oculta lo que el rol nunca podrá hacer.
- Deshabilita, con explicación al pasar el cursor, lo que no está disponible por el estado actual del registro. Un control deshabilitado sin motivo visible es un callejón sin salida.
- `root` pasa cualquier verificación de rol, tanto en el backend como en `hasRole`. No sirve para comprobar permisos: prueba con coordinador y con supervisor.

## Detalle

- Empieza con volver, identificador, entidad principal y estado.
- Agrupa pares label/valor en una grilla y muestra una línea de actividad cuando el seguimiento temporal sea importante.
- Las acciones dependen del estado y del rol; evita acciones imposibles o deshabilitadas sin explicación.
- La información extensa o poco frecuente puede ir en tabs, pero la primera vista debe resolver la pregunta principal.

## Tableros

- Muestra primero los elementos que requieren atención, luego el progreso general.
- Limita los indicadores a los que permiten decidir o detectar desvíos.
- Mantén significados de color estables usando los tokens de estado: `info`, `success`, `warning` y `destructive`.
- Evita tarjetas métricas que solo repiten datos de un gráfico o tabla.

## Estados y badges

- Badge compacto con texto y, cuando ayude, un icono de 12–14 px.
- Usa fondos suaves del token de estado y texto con contraste; no uses bloques saturados para todas las filas.
- Mantén la misma etiqueta y color para un estado en toda la aplicación.
- Estados sugeridos del dominio: pendiente, asignado, en ruta, entregado, reprogramado, cancelado e incidencia. Confirma los nombres con la configuración o tipos del dominio antes de implementarlos.

## Botones y acciones

- `default`: acción principal de la sección.
- `outline` o `secondary`: acciones secundarias.
- `ghost`: acciones de bajo énfasis y menús de fila.
- `destructive`: eliminación o acción irreversible.
- Usa verbos específicos. `Crear despacho` comunica mejor que `Aceptar`.
- Una acción con carga conserva su ancho, muestra progreso y evita envíos repetidos.
- Los enlaces secundarios no usan naranja: se distinguen con subrayado, no solo por color.

## Revisión responsiva

Comprueba como mínimo:

- 320–390 px: navegación accesible, formularios en una columna, acciones sin recorte y tablas transformadas.
- 768 px: sidebar contraído o drawer y toolbar que pueda envolver.
- 1024 px o más: tabla sin scroll horizontal innecesario y formularios con jerarquía clara.
- Zoom de texto al 200 %, teclado, foco visible, modo claro y oscuro.
