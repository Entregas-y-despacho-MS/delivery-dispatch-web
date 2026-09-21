---
name: delivery-dispatch-design
description: Diseña, implementa o revisa interfaces React y Tailwind de Delivery Dispatch con su sistema visual y sus patrones de navegación, tablas, formularios, detalle y estados responsivos. Úsala para trabajo UI/UX en esta aplicación; no para cambios exclusivos de backend o lógica de negocio sin interfaz.
---

# Delivery Dispatch Design

Construye superficies operativas sobrias, rápidas de leer y consistentes con la identidad naranja y grafito de Delivery Dispatch.

## Antes de diseñar

1. Inspecciona la pantalla, los componentes compartidos y el flujo de datos que ya existen. Conserva el comportamiento y el vocabulario del dominio.
2. Lee [references/visual-language.md](references/visual-language.md) para cualquier decisión visual.
3. Lee [references/component-patterns.md](references/component-patterns.md) al crear o modificar una pantalla, tabla, formulario, detalle, dashboard o estado de interfaz.
4. Lee [references/implementation-map.md](references/implementation-map.md) antes de editar el código del repositorio.

## Reglas esenciales

- Usa los tokens semánticos de `src/index.css`. No introduzcas colores Tailwind literales para superficies, texto, bordes o estados.
- Reutiliza primero los componentes de `src/shared/components/ui` y `src/shared/components/common`. Extiende un componente compartido cuando el patrón se repita en varios dominios.
- Reserva el naranja para la acción principal, la selección y la identidad. Una sección tiene como máximo una acción principal visible.
- Para estados usa los tokens `destructive`, `warning`, `success` e `info` con fondo suave y texto contrastado. Las series `chart-*` son solo para gráficas.
- Usa iconos Lucide para navegación, acciones, estados, conceptos operativos y para anticipar el contenido de un campo. No los uses como relleno ni mezcles tamaños en una misma fila; no uses emojis.
- Usa placeholders con ejemplos reales y breves del dato. Siempre acompañan a un label visible, nunca lo reemplazan.
- No marques campos obligatorios con asteriscos. Asume que son obligatorios y añade `Opcional` junto a los que no lo sean.
- Valida al salir del campo y revalida en cada cambio solo después del primer error.
- El toast confirma lo que ya terminó; lo que el usuario debe corregir o decidir va inline, junto a lo que lo causó.
- Mantén las tablas legibles sin depender del desplazamiento horizontal en escritorio. Agrupa dato principal y secundario dentro de una misma celda y mueve lo infrecuente al detalle.
- Escribe textos propios de una herramienta operativa: breves, específicos y orientados a la tarea. No muestres códigos internos como `RF-A06` al usuario.
- Incluye estados de carga, vacío, sin resultados, error, éxito y deshabilitado cuando el flujo pueda alcanzarlos.
- Diseña desde el principio para escritorio, sidebar contraído y móvil. No reduzcas tipografía hasta volverla ilegible para hacer caber contenido.
- Mantén accesibilidad por teclado, foco visible, etiquetas asociadas, mensajes de error cercanos y significado que no dependa solo del color.

## Forma de trabajo

1. Clasifica la pantalla como listado, formulario, detalle o tablero.
2. Define la jerarquía: tarea principal, información necesaria para decidir y acciones secundarias.
3. Compón con los patrones de la referencia, adaptando la densidad al trabajo operativo.
4. Conserva información secundaria detrás de una interacción clara cuando mostrarla perjudique la lectura.
5. Verifica la interfaz con datos realistas, textos largos, estado vacío, errores y ancho móvil.
6. Ejecuta las comprobaciones del repositorio indicadas en la guía de implementación.

No agregues dependencias, funcionalidades, métricas o controles que el producto no necesita solo para llenar espacio. Si una decisión de producto cambia el flujo, explica la decisión antes de implementarla.
