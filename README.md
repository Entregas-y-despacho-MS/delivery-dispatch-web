# delivery-dispatch-web

React + Vite + TypeScript. Arquitectura modular por dominios.

## Arranque

```bash
npm install
cp .env.example .env     # apunta VITE_API_URL a tu backend
npm run dev
```

Scripts: `dev` · `build` · `typecheck` · `lint` · `preview`

## Capas

```
pages/  →  domains/  →  shared/
```

Las flechas van en un solo sentido, y oxlint lo hace cumplir
(`npm run lint` falla si te saltas el barrel de un dominio o si
`domains/` o `shared/` importan de `pages/`).

| Carpeta | Qué va aquí |
|---|---|
| `src/app/` | Arranque: providers, router, navegación del sidebar |
| `src/config/` | `env.ts` (validado con Zod) y `roles.ts` (única fuente de verdad) |
| `src/pages/` | Pantallas. Solo composición: no hablan con axios |
| `src/domains/` | El negocio. Un módulo por carpeta, con `index.ts` como API pública |
| `src/shared/` | Reutilizable: ui (shadcn), layouts, hooks, store, guards |

## Las piezas que te ahorran trabajo

| Archivo | Qué hace |
|---|---|
| `shared/lib/axios.ts` | Token automático + errores HTTP → toast + logout en 401 |
| `shared/lib/base.service.ts` | `createCrudService<T>("/ruta")` → CRUD tipado |
| `shared/hooks/use-crud.ts` | data, loading, create/update/delete con caché e invalidación |
| `shared/components/common/` | `PageHeader`, `DataTable` |
| `shared/components/feedback/` | `ErrorBoundary`, `EmptyState`, `LoadingScreen` |

## Crear un módulo

```bash
bash scripts/nuevo-dominio.sh clientes
```

Crea el dominio completo **y** lo engancha solo a la ruta `/app/clientes`
y al sidebar. Solo ajustas el icono y los roles en `src/app/navigation.ts`.

## Convenciones

- Archivos en **kebab-case**, componentes exportados en **PascalCase**.
- Los esquemas Zod viven dentro de su dominio, no en una carpeta aparte.
- Nunca `roles: [1]`: usa `ROLES.ADMIN`.
- El guard del router es **UX, no seguridad**: quien autoriza es el backend.
