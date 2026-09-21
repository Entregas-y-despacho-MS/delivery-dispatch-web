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

## Tipografía

- Usa la familia del sistema ya configurada por la app.
- Título de pantalla: `text-2xl` o `text-3xl`, semibold, tracking ajustado.
- Encabezado de sección: `text-sm` o `text-base`, semibold.
- Texto operativo y controles: `text-sm` como base.
- Metadatos y ayuda: `text-xs`, solo para información secundaria.
- Números comparables, horas y métricas: cifras tabulares cuando ayuden a alinearlos.

Evita mayúsculas extensas. Úsalas únicamente en etiquetas de navegación o eyebrow muy breves, con contraste suficiente.

## Espaciado y geometría

- Trabaja con pasos de 4 px; prioriza 8, 12, 16, 24 y 32 px.
- Padding de página: 16 px en móvil, 24 px en tablet y 24–32 px en escritorio.
- Usa `--radius` como base. Los controles suelen usar `rounded-md`; las superficies, `rounded-lg`.
- Los campos y botones principales deben tener entre 40 y 44 px de alto. En superficies táctiles, conserva un objetivo efectivo cercano a 44 px.
- Las sombras deben ser sutiles y poco frecuentes. Los bordes y cambios de superficie hacen la mayor parte de la separación.
- No anides tarjetas para resolver cada agrupación. Usa espaciado, separadores y encabezados de sección.

## Iconografía

Usa `lucide-react`, trazos consistentes y tamaños de 16–20 px. Un icono debe cumplir una de estas funciones:

- reconocer una sección de navegación;
- explicar una acción;
- reforzar un estado junto a texto;
- identificar un concepto operativo complejo.

Las acciones pequeñas con solo icono necesitan `aria-label` y tooltip cuando el significado no sea universal. El color nunca sustituye a la etiqueta del estado.

## Movimiento

Usa transiciones breves para hover, apertura y cambios de estado. No animes la aparición inicial de listas, no uses movimiento continuo y respeta `prefers-reduced-motion`.

## Voz del producto

- Títulos: sustantivos o acciones concretas, por ejemplo `Despachos` o `Nuevo despacho`.
- Descripciones: una frase corta que ayude a actuar.
- Vacíos: explica qué falta y ofrece la acción que lo resuelve.
- Errores: indica qué debe corregirse junto al campo o acción afectada.
- Éxito: confirma el resultado y, si aplica, el siguiente estado del registro.

Evita slogans, tecnicismos internos, requisitos codificados y texto que describa la propia interfaz.
