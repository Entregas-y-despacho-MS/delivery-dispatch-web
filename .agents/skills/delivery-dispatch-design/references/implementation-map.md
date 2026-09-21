# Mapa de implementación

## Stack y convenciones

La aplicación usa React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Lucide, React Hook Form y Zod. Conserva estas dependencias y sus patrones actuales.

Rutas relevantes:

- Tokens y temas: `src/index.css`.
- Layout principal: `src/shared/components/layout/dashboard-layout.tsx`.
- Configuración de navegación y roles: `src/app/navigation.ts` y `src/config/roles.ts`.
- Primitivas: `src/shared/components/ui/`.
- Composición compartida: `src/shared/components/common/`.
- Feedback: `src/shared/components/feedback/`.
- Utilidades y helpers de formato: `src/shared/lib/`.
- Páginas: `src/pages/dashboard/`.
- Componentes por dominio: `src/domains/<dominio>/components/`.
- Esquemas y tipos: `src/domains/<dominio>/*.schemas.ts` y `*.types.ts`.

## Decisiones de código

- Importa utilidades con los alias del proyecto, por ejemplo `@/shared/lib/utils`.
- `cn` fusiona clases de Tailwind: puedes sobrescribir la altura o el padding de una primitiva desde `className` sin editarla.
- Usa las primitivas existentes `Button`, `Input`, `Select`, `Textarea`, `Dialog`, `Sheet`, `DropdownMenu`, `Badge`, `Table`, `Tabs`, `Alert`, `Skeleton` y `Tooltip` cuando coincidan semánticamente.
- Compón estilos en la capa de uso. Modifica una primitiva de `ui/` solo si el cambio es correcto para todas sus apariciones.
- Crea o amplía componentes compartidos cuando al menos dos dominios necesiten el mismo patrón. Mantén la lógica específica dentro del dominio.
- Mantén navegación y permisos como datos en `src/app/navigation.ts`; no dupliques rutas dentro del sidebar.
- Conserva validación en Zod y manejo de formulario con React Hook Form. Los errores del servidor también deben llegar al campo o mensaje general correspondiente.
- No sustituyas componentes accesibles de Radix por controles hechos a mano.
- Los anchos del sidebar viven en `ui/sidebar.tsx` (`SIDEBAR_WIDTH`, `SIDEBAR_WIDTH_ICON`, `SIDEBAR_WIDTH_MOBILE`). Cámbialos ahí si hace falta, no en cada pantalla.

## Mejoras esperadas sobre la base actual

- `PageHeader` debe recibir contenido orientado al usuario; elimina textos de requisitos internos como `RF-A26` de la interfaz visible.
- `DataTable` necesita evolucionar según el caso: toolbar, filtros, paginación y variante móvil. No añadas todo a cada tabla si el flujo no lo requiere.
- `EmptyState` debe distinguir entre colección vacía y búsqueda sin resultados, con acciones diferentes.
- El layout debe mostrar perfil en un solo lugar y breadcrumb/contexto en la barra superior.
- Formularios todavía vacíos deben seguir los patrones del dominio y la referencia de formularios; no dupliques markup entre crear y editar.
- Falta un helper de formato de fecha, hora y duración en `src/shared/lib`. Créalo al primer caso que lo necesite en vez de formatear en la pantalla.
- `Alert` solo tiene las variantes `default` y `destructive`. Añade las variantes de `warning`, `success` e `info` sobre los tokens de estado cuando aparezca el primer caso real.

## Verificación

Después de modificar código:

1. Ejecuta `npm run typecheck`.
2. Ejecuta `npm run lint`.
3. Ejecuta `npm run build` cuando el cambio afecte estructura, estilos globales o rutas.
4. Revisa manualmente la pantalla con tema claro y oscuro.
5. Revisa al menos un ancho móvil y uno de escritorio.
6. Prueba carga, vacío, sin resultados, error, datos largos y permisos relevantes al flujo.

El proyecto todavía no tiene runner de pruebas: los scripts disponibles son `dev`, `build`, `lint`, `preview` y `typecheck`. Mientras siga así, la verificación es la lista de arriba y no debes afirmar que algo quedó probado automáticamente.

Cuando se incorpore un runner, prueba comportamiento observable —filtrado, validación, navegación, acciones por rol y preservación de datos— y no pruebas que solo repitan clases CSS.
