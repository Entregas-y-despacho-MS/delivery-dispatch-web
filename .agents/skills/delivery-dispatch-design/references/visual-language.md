# Lenguaje visual

## Tesis

Delivery Dispatch es un centro de operaciones logísticas. La interfaz debe sentirse precisa, serena y rápida, incluso cuando muestra incidencias. La personalidad proviene de la combinación de grafito, superficies neutras y un naranja vivo usado con disciplina.

## Color

`src/index.css` es la fuente canónica. Usa sus tokens semánticos en lugar de duplicar valores:

- `background` para el lienzo general.
- `card` para superficies elevadas o agrupaciones necesarias.
- `foreground` para texto principal.
- `muted` y `muted-foreground` para superficies secundarias y metadatos.
- `border` e `input` para estructura y controles.
- `primary` para la acción principal, el elemento seleccionado y pequeños acentos de marca.
- `destructive` solo para errores y acciones destructivas.
- `chart-2`, `chart-3` y `chart-4` para información, éxito y riesgo en gráficas; no como decoración.

El naranja no debe cubrir grandes áreas ni aparecer simultáneamente en varias acciones. Sobre `primary` usa siempre `primary-foreground`.

El modo oscuro debe conservar la misma jerarquía. Revisa contraste, bordes y estados en ambos temas; no presupongas que reducir opacidad produce contraste suficiente.

### Estados fuera de las gráficas

Las series `chart-*` son para gráficas. Para alertas, badges y mensajes de estado usa los tokens de estado, que ya están definidos en ambos temas:

- `destructive` — error y acción irreversible.
- `warning` — advertencia: algo que el usuario debe atender pero no impide continuar.
- `success` — confirmación de un resultado.
- `info` — dato o contexto que no exige acción.

Se usan como color de texto e icono sobre un fondo suave del mismo token, igual que `destructive`: `bg-warning/10 text-warning`. No pintes bloques saturados con estos colores ni los repitas en cada fila de una tabla.

Mantén el significado estable en toda la aplicación: un mismo estado usa siempre el mismo token y la misma etiqueta.

### Contraste exigible

- Texto normal 4.5:1. Texto grande, iconos informativos y bordes de control 3:1.
- El anillo de foco necesita 3:1 contra la superficie adyacente.
- El color nunca es el único portador de significado: acompáñalo de texto, icono o subrayado.

## Tipografía

- Usa la familia del sistema ya configurada por la app.
- Título de pantalla: `text-2xl` o `text-3xl`, semibold, tracking ajustado.
- Encabezado de sección: `text-sm` o `text-base`, semibold.
- Texto operativo y controles: `text-sm` como base.
- Metadatos y ayuda: `text-xs`, solo para información secundaria.
- Mensajes de error: nunca por debajo de `text-sm`. Un error no es metadato.
- Números comparables, horas y métricas: cifras tabulares cuando ayuden a alinearlos.

Evita mayúsculas extensas. Úsalas únicamente en etiquetas de navegación o eyebrow muy breves, con contraste suficiente.

## Formato de datos operativos

El producto se usa para coordinar entregas por teléfono y radio: los datos deben poder leerse en voz alta sin ambigüedad.

- Fecha y hora en 24 h. Muestra siempre el valor absoluto; el relativo (`hace 5 min`) solo como complemento, nunca como único dato de un registro.
- Indica la zona horaria cuando el dato pueda leerse desde otra.
- Duraciones y ETA en la unidad de trabajo: `18 min`, `1 h 05`.
- Centraliza el formato en un helper de `src/shared/lib`. No disperses `toLocaleString` por las pantallas.
- En columnas comparables usa cifras tabulares, alinea los números a la derecha y coloca la unidad junto al número, no en el encabezado.
- Identificadores y códigos de seguimiento no se truncan nunca.

## Espaciado y geometría

- Trabaja con pasos de 4 px; prioriza 8, 12, 16, 24 y 32 px.
- Padding de página: 16 px en móvil, 24 px en tablet y 24–32 px en escritorio.
- Usa `--radius` como base. Los controles suelen usar `rounded-md`; las superficies, `rounded-lg`.
- Los campos y botones principales deben tener entre 40 y 44 px de alto. En superficies táctiles, conserva un objetivo efectivo cercano a 44 px, también en los iconos de acción dentro de una fila de tabla.
- El ancho de un campo comunica la longitud esperada: una placa, un código postal o una cantidad no ocupan lo mismo que una dirección.
- Las sombras deben ser sutiles y poco frecuentes. Los bordes y cambios de superficie hacen la mayor parte de la separación.
- No anides tarjetas para resolver cada agrupación. Usa espaciado, separadores y encabezados de sección.

## Iconografía

Usa `lucide-react`, trazos consistentes y tamaños de 16–20 px. Un icono debe cumplir una de estas funciones:

- reconocer una sección de navegación;
- explicar una acción;
- reforzar un estado junto a texto;
- identificar un concepto operativo complejo;
- anticipar el contenido de un campo de formulario.

Mantén un tamaño por contexto y no mezcles varios en la misma fila. Un icono puramente visual lleva `aria-hidden`; uno que es la única etiqueta de un control lleva `aria-label`, y tooltip cuando su significado no sea universal. El color nunca sustituye a la etiqueta del estado.

## Movimiento

Usa transiciones breves para hover, apertura y cambios de estado. No animes la aparición inicial de listas, no uses movimiento continuo y respeta `prefers-reduced-motion` mediante el variante `motion-safe`.

## Voz del producto

- Títulos: sustantivos o acciones concretas, por ejemplo `Despachos` o `Nuevo despacho`.
- Descripciones: una frase corta que ayude a actuar.
- Vacíos: explica qué falta y ofrece la acción que lo resuelve.
- Errores: indica qué debe corregirse junto al campo o acción afectada.
- Éxito: confirma el resultado y, si aplica, el siguiente estado del registro.

Evita slogans, tecnicismos internos, requisitos codificados y texto que describa la propia interfaz.
