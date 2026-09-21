# Patrones de componentes y pantallas

## Estructura de la aplicación

### Sidebar

- Escritorio: 240–260 px abierto; aproximadamente 64–72 px contraído.
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
- Usa un ancho máximo coherente; mapas y superficies densas pueden aprovechar todo el ancho disponible.
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
- Carga: skeletons con la forma de la tabla.
- Lista vacía: explica cómo crear el primer registro.
- Sin resultados: conserva filtros visibles y permite limpiarlos.
- Error: mensaje cercano con una acción de reintento cuando tenga sentido.
- Móvil: convierte cada fila en una composición vertical que preserve identificador, cliente, destino, estado y acceso al detalle. Evita scroll horizontal salvo que comparar columnas sea la tarea principal.

## Formularios

- Usa página completa para creación, edición o flujos con varias secciones. Usa dialog para tareas cortas de hasta unos pocos campos; sheet para edición contextual que deba conservar la referencia visual.
- Agrupa campos por significado, no por tamaño visual. Cada sección tiene título y, si aporta información, una frase breve.
- Una columna en móvil. Dos columnas en escritorio solo para campos relacionados.
- Coloca label visible encima del control. Todos los campos se consideran obligatorios salvo los que muestran `Opcional` junto al label.
- La ayuda preventiva aparece debajo del control. El error reemplaza o sigue a la ayuda y explica la corrección.
- Usa `aria-invalid`, `aria-describedby` y foco en el primer campo inválido al enviar.
- Mantén `Cancelar` como acción secundaria y `Guardar`, `Crear` o la acción específica como primaria.
- Si hay riesgo de perder cambios, avisa antes de abandonar.
- Después de guardar, confirma el resultado y navega al listado o detalle previsto por el flujo.
- Un resumen lateral es útil cuando el formulario configura una entidad compleja; se oculta o se integra al flujo en móvil.

## Detalle

- Empieza con volver, identificador, entidad principal y estado.
- Agrupa pares label/valor en una grilla y muestra una línea de actividad cuando el seguimiento temporal sea importante.
- Las acciones dependen del estado y del rol; evita acciones imposibles o deshabilitadas sin explicación.
- La información extensa o poco frecuente puede ir en tabs, pero la primera vista debe resolver la pregunta principal.

## Tableros

- Muestra primero los elementos que requieren atención, luego el progreso general.
- Limita los indicadores a los que permiten decidir o detectar desvíos.
- Mantén significados de color estables: información, éxito, advertencia y error.
- Evita tarjetas métricas que solo repiten datos de un gráfico o tabla.

## Estados y badges

- Badge compacto con texto y, cuando ayude, un icono de 12–14 px.
- Usa fondos suaves y texto con contraste; no uses bloques saturados para todas las filas.
- Mantén la misma etiqueta y color para un estado en toda la aplicación.
- Estados sugeridos del dominio: pendiente, asignado, en ruta, entregado, reprogramado, cancelado e incidencia. Confirma los nombres con la configuración o tipos del dominio antes de implementarlos.

## Botones y acciones

- `default`: acción principal de la sección.
- `outline` o `secondary`: acciones secundarias.
- `ghost`: acciones de bajo énfasis y menús de fila.
- `destructive`: eliminación o acción irreversible.
- Usa verbos específicos. `Crear despacho` comunica mejor que `Aceptar`.
- Una acción con carga conserva su ancho, muestra progreso y evita envíos repetidos.

## Revisión responsiva

Comprueba como mínimo:

- 320–390 px: navegación accesible, formularios en una columna, acciones sin recorte y tablas transformadas.
- 768 px: sidebar contraído o drawer y toolbar que pueda envolver.
- 1024 px o más: tabla sin scroll horizontal innecesario y formularios con jerarquía clara.
- Zoom de texto al 200 %, teclado, foco visible, modo claro y oscuro.
