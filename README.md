# delivery-dispatch-web

Portal web del **Microservicio de Gestión de Entregas y Despachos**, uno de los nueve
componentes del ERP corporativo de la cadena de supermercados (Grupo H).

Una sola aplicación que sirve a **dos públicos distintos**:

| Portal | Quién entra | Cómo |
|---|---|---|
| **Panel administrativo** | Coordinador de Despachos y Supervisor de Flota | Con usuario y contraseña |
| **Portal del cliente** | Cliente final | **Sin login**: con un token de seguimiento en la URL (RF-U14) |

> El **repartidor no usa esta web**. Sus 14 requerimientos son de la app móvil
> (React Native), que es otro proyecto. Aquí el repartidor existe solo como dato:
> a quién se le asigna un despacho y qué desempeño tiene.

---

## Arranque rápido

```bash
npm ci
cp .env.example .env    # apunta VITE_API_URL y VITE_SOCKET_URL a tu backend
npm run dev
```

Abre <http://localhost:3000>.

### Referencia de API

La [guía de todos los endpoints](docs/API.md) incluye rutas, permisos, campos de
solicitud y respuesta (también los anidados), ejemplos y errores. La
[especificación OpenAPI](docs/openapi.json) se puede usar como contexto estructurado
en otro chat de este proyecto. Para el catálogo de motivos de incidencia, consulta
la [guía detallada de Incident Reasons](docs/INCIDENT_REASONS.md), con filtros,
validaciones, ejemplos completos y el campo `active` de actualización. Para los
motivos de reprogramación, consulta la [guía de Reschedule Reasons](docs/RESCHEDULE_REASONS.md),
actualizada con `code`, `affectsSla` y las reglas de duplicados.
Los cinco endpoints nuevos de tipos de incidente vehicular y registro de mantenimiento
están en la [guía de incidentes vehiculares](docs/VEHICLE_INCIDENTS.md).

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila TypeScript y genera `dist/` |
| `npm run typecheck` | Solo revisa tipos, sin compilar |
| `npm run lint` | oxlint, incluidas las reglas de frontera entre capas |
| `npm run preview` | Sirve el `dist/` ya compilado |

### Ejecutar con el Compose local

Desde la carpeta contenedora del workspace, ejecuta `docker compose up -d --build`. La web queda
disponible en <http://localhost:8080> y usa la API del backend en <http://localhost:3000/api>.
Para reconstruir solo la web, ejecuta `docker compose build web` y luego reinicia ese servicio.

### Construir y ejecutar la imagen Web

La imagen recibe las direcciones públicas del API y de Socket.IO durante el build de Vite. Usa
direcciones alcanzables desde el navegador del usuario (no `localhost` si el portal se abre desde
otro equipo):

```bash
docker build \
  --build-arg VITE_API_URL=https://api.example.com/api \
  --build-arg VITE_SOCKET_URL=https://api.example.com \
  -t delivery-dispatch-web .
docker run --rm -p 8080:80 delivery-dispatch-web
```

Abre <http://localhost:8080>. El endpoint `/healthz` sirve para comprobar el contenedor y las rutas
del portal, por ejemplo `/app/tablero`, devuelven la aplicación para que React Router resuelva la
navegación.

### Cómo probar el panel sin backend

Si el backend no está ejecutándose, no puedes loguearte de verdad. Para previsualizar
el panel, abre la consola del navegador y simula la sesión:

```js
localStorage.setItem('delivery-dispatch-web-auth', JSON.stringify({
  state: { user: { id:'1', nombres:'Sergio', apellidos:'Mendoza',
                   rol:{ id:1, nombre:'Coordinador' } }, access_token:'falso' },
  version: 0
}));
location.href = '/app/tablero';
```

`rol.id = 1` es Coordinador, `2` es Supervisor. Para salir: `localStorage.clear()`.

---

## Stack

| Capa | Herramienta |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript 6 |
| Rutas | React Router v7 (lazy por ruta) |
| Estilos | Tailwind v4 + shadcn/ui |
| Datos del servidor | TanStack Query |
| Sesión | Zustand (con persistencia) |
| Peticiones | axios con interceptores |
| Formularios | React Hook Form + Zod |
| Tiempo real | socket.io-client |
| Mapas | Leaflet + react-leaflet |
| Gráficas | Recharts |
| Avisos | sonner |
| Linter | oxlint |

---

## La regla que sostiene todo

```
pages/  →  domains/  →  shared/ y config/
             ↕
      otros dominios por index.ts público, sin ciclos
```

Las páginas componen pantallas y consumen los barrels públicos. Los dominios pueden
usar APIs públicas de otros dominios, pero nunca sus rutas internas ni `pages/`;
evitamos ciclos. La infraestructura compartida vive en `shared/` y la configuración
común en `config/`.

Esto no es una recomendación: **oxlint lo hace cumplir**. `npm run lint` falla si te
saltas el barrel de un dominio o si `domains/` o `shared/` importan de `pages/`.

---

## Mapa de la raíz

| Archivo | Para qué sirve |
|---|---|
| `index.html` | El único HTML. Vite inyecta aquí el bundle. |
| `vite.config.ts` | Puerto 3000, plugin de Tailwind y el alias `@` → `./src`. |
| `tsconfig.json` · `tsconfig.app.json` · `tsconfig.node.json` | Configuración de TypeScript. El alias `@` también se declara aquí. |
| `components.json` | Config de shadcn. Define dónde caen los componentes al instalarlos. |
| `.oxlintrc.json` | Reglas del linter, incluidas las fronteras entre capas. |
| `.env` / `.env.example` | URLs del backend. `.env` no se sube al repo. |
| `package.json` | Dependencias y scripts. |
| `scripts/nuevo-dominio.sh` | Generador de módulos (ver el final de este documento). |
| `public/` | Archivos que se sirven tal cual, sin pasar por el bundler. |

---

## `src/` — carpeta por carpeta

### Archivos sueltos

| Archivo | Para qué sirve |
|---|---|
| `main.tsx` | El punto de entrada. Monta React y envuelve todo en los providers y el router. |
| `index.css` | Tailwind y **todos los tokens de color** en formato OKLCH, para modo claro y oscuro. Si quieres cambiar la identidad visual, es aquí. |
| `index.css.bak` | Respaldo de la paleta anterior (gris neutro). Se puede borrar. |
| `assets/` | Imágenes que sí pasan por el bundler. |

### `app/` — el arranque de la aplicación

Tres archivos, y solo estos tres. Aquí no va lógica de negocio.

| Archivo | Para qué sirve |
|---|---|
| `providers.tsx` | Envuelve la app: ErrorBoundary → tema → TanStack Query → avisos. |
| `router.tsx` | **Todas las rutas del sistema**, cargadas con `lazy()` para que cada pantalla se descargue solo cuando se entra a ella. Aquí también se declara qué rol puede ver qué. |
| `navigation.ts` | El menú lateral, **como datos, no como interfaz**. Cada ítem lleva su título, ruta, icono y los roles que lo ven. El layout solo recorre esta lista. |

### `config/` — la única fuente de verdad

Valores que no se repiten en ningún otro lado. Si un dato está aquí, está aquí y punto.

| Archivo | Para qué sirve |
|---|---|
| `roles.ts` | `ROLES` (Coordinador, Supervisor, Repartidor), sus etiquetas, `ROLES_WEB` y el helper `hasRole()`. **Nunca escribas `roles: [1]` a mano.** |
| `env.ts` | Lee las variables de entorno y **las valida con Zod al arrancar**. Si falta una, la app falla de inmediato con un mensaje claro en vez de romperse a media petición. |
| `despachos.ts` | Estados del despacho, tipos (entrega / recojo / traslado), prioridades y estados de vehículo. *(pendiente)* |

### `pages/` — las pantallas

Cada archivo es **una pantalla**. Su único trabajo es componer: llamar al hook de su
dominio y acomodar los componentes. **Una página nunca habla con axios directamente.**

Cada página exporta por defecto (`export default`), porque el router las carga con `lazy()`.

```
pages/
├── public/       home-page · not-found
│                 seguimiento-buscar · seguimiento-detalle   ← portal del cliente
├── auth/         login-page · acceso-denegado
│                 recuperar-password · restablecer-password
└── dashboard/    las 18 pantallas del panel, incluida catalogos/ con 5
```

### `domains/` — el negocio

**Aquí vive todo lo que sabe del negocio.** Un subdirectorio por módulo, cada uno
autocontenido. Todos siguen exactamente la misma estructura, así que la explico
una sola vez:

```
domains/<dominio>/
├── index.ts                 ← API pública cuando existan consumidores externos
├── types/*.types.ts          tipos de contrato y tipos del dominio
├── schemas/*.schemas.ts      esquemas Zod de validación
├── services/*.service.ts       las llamadas HTTP
├── hooks/use-*.ts              la lógica reutilizable del módulo
└── components/*.tsx            componentes que solo usa este dominio
```

**`index.ts` es la API pública del módulo.** Las páginas y otros dominios importan desde ahí,
nunca usan rutas internas. El barrel contiene solo símbolos que necesiten consumidores
externos; lo que solo se usa dentro del dominio permanece privado. Si el dominio todavía
no tiene consumidores externos, no crees un barrel vacío; agrégalo cuando haya algo que
publicar:

```ts
import { despachosService, useDespachos } from "@/domains/despachos";   // ✅
import { despachosService } from "@/domains/despachos/services/...";    // ❌ el linter lo rechaza
```

¿Por qué importa? Porque lo que **no** exportas en el barrel es privado del módulo.
Puedes reorganizar todo por dentro —renombrar archivos, partir servicios, mover
componentes— sin romper a nadie.

**Reglas de los dominios:**

1. Una página importa APIs públicas desde el `index.ts` del dominio. No usa rutas
   internas como `@/domains/flota/hooks/...`.
2. Si un dominio necesita otro dominio, importa solo desde su `index.ts` público;
   nunca desde sus archivos internos. Evita ciclos y mueve a `shared/` la lógica que
   realmente sea común.
3. Los esquemas Zod viven en `schemas/` dentro de su dominio.
4. Los archivos de tipos viven en `types/`. Los tipos reflejan el contrato del
   backend o el dominio, no necesidades ad hoc de una pantalla.

**Los 11 dominios y qué requerimientos cubre cada uno:**

| Dominio | Cubre |
|---|---|
| `auth` | Login, recuperación de contraseña, cierre por inactividad — RF-A01, A12, A21–A25 |
| `despachos` | El núcleo: órdenes, estados, prioridad, reprogramación, recojos, calificaciones y reclamos — RF-A02, A05, A06, A09, A11, A39, U19–U22 |
| `planificacion` | Agrupar por zona, validar capacidad, asignar y reasignar — RF-A03, A04, A16 |
| `seguimiento` | Posiciones desde Traccar, mapa, ETA y la vista pública del cliente — RF-A06, A13, U15, U17 |
| `flota` | Vehículos, disponibilidad y mantenimiento — RF-A13, A15, A17, A30, A34 |
| `usuarios` | Usuarios internos, roles y repartidores (desempeño e historial) — RF-A26–A28, A08, A14, U18 |
| `incidencias` | Registro, alertas críticas y reclamos — RF-A19, A32, U22 |
| `reportes` | Cumplimiento, SLA e indicadores de flota — RF-A07, A14, A18 |
| `catalogos` | Zonas, niveles de servicio, motivos de incidencia y de reprogramación, tipos de incidente — RF-A29–A34 |
| `auditoria` | RF-A37 y RF-A38 pendientes; la página actual es un placeholder sin implementación conectada. |
| `configuracion` | Ventana horaria, umbrales de SLA, política de contraseñas — RF-A10, A20, A25 |

### `shared/` — lo reutilizable

Lo que usan dos o más dominios. Si algo aquí lo usa **un solo** dominio, está mal
ubicado: pertenece a ese dominio.

#### `shared/lib/` — la infraestructura

| Archivo | Para qué sirve |
|---|---|
| `axios.ts` | **El cliente de la API.** Pone el `baseURL`, inyecta el JWT en cada petición y traduce los errores HTTP a un aviso legible. En un 401 además cierra la sesión solo. |
| `base.service.ts` | `createCrudService({...})` recibe un objeto de opciones (`endpoint`, mapeos y método de actualización) y devuelve `list`, `getOne`, `create`, `update` y `delete` tipados. Las listas se normalizan a `{ items, total, page?, pageSize?, pages? }`. |
| `query-keys.ts` | Claves de caché consistentes. Evita el bug clásico de invalidar `"cliente"` cuando la query se llamaba `"clientes"` y la tabla nunca se refresca. |
| `public-api.ts` | Segunda instancia de axios **sin** el header de autorización, para el portal del cliente. *(pendiente)* |
| `socket.ts` | Conexión WebSocket para el tablero en tiempo real. *(pendiente)* |
| `theme-provider.tsx` | Aplica el tema claro/oscuro y lo recuerda. |
| `utils.ts` | `cn()`, para combinar clases de Tailwind sin conflictos. |

#### `shared/hooks/`

| Archivo | Para qué sirve |
|---|---|
| `use-crud.ts` | **El hook que más trabajo te ahorra.** Ver la sección siguiente. |
| `use-hydrated.ts` | Avisa cuándo terminó de leerse la sesión de localStorage. Sin esto, al recargar te sacaría al login por un instante. |
| `use-theme.ts` | Acceso al tema actual. |
| `use-mobile.ts` | Detecta pantalla de móvil (lo usa el sidebar). |
| `use-socket.ts` | Suscribirse a eventos del backend e invalidar consultas cuando llegan. *(pendiente)* |
| `use-idle-timeout.ts` | Cierre de sesión por inactividad — RF-A24. *(pendiente)* |

#### `shared/store/`

| Archivo | Para qué sirve |
|---|---|
| `use-auth-store.ts` | La sesión: `user`, `access_token`, `setLogin()` y `logout()`. Se persiste en localStorage con la clave `delivery-dispatch-web-auth`. |

#### `shared/guards/`

| Archivo | Para qué sirve |
|---|---|
| `protected-route.tsx` | Bloquea las rutas privadas y filtra por rol. Es el equivalente al middleware de Next. **Ojo: esto es experiencia de usuario, no seguridad** — quien realmente autoriza es el backend. |

#### `shared/components/`

| Carpeta | Qué contiene |
|---|---|
| `ui/` | Los 22 componentes de shadcn (botón, tabla, diálogo, sidebar…). **No los edites a mano** salvo que sepas lo que haces: se regeneran con el CLI de shadcn. |
| `layout/` | `public-layout` (sitio público), `dashboard-layout` (sidebar + cabecera del panel) y `tracking-layout` (portal del cliente, sin sidebar ni sesión). |
| `common/` | Piezas propias reutilizables activas: `page-header` y `data-table`. |
| `feedback/` | `error-boundary` (evita la pantalla en blanco si algo revienta), `loading-screen` y `empty-state`. |
| `theme-toggle.tsx` | El botón de claro/oscuro. |

---

## Las tres piezas que te ahorran el 80% del trabajo

Una pantalla CRUD completa son tres archivos y ningún `try/catch`:

**1. El servicio** — `domains/<x>/services/<x>.service.ts`

```ts
import { createCrudService } from "@/shared/lib/base.service";
import type { DeliveryZonesResponse, Zona, ZonaInput, ZonaListParams } from "../types/catalogos.types";

export const zonasService = createCrudService<
  Zona, Zona, ZonaInput, ZonaInput, ZonaListParams, DeliveryZonesResponse
>({
  endpoint: "/delivery-zones",
  updateMethod: "put",
  mapListResponse: ({ data, meta }) => ({
    items: data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});
```

El primer tipo es la respuesta de un elemento de la API; el segundo, el modelo que usa la app;
siguen los payloads de creación y edición, los parámetros de lista y el tipo de respuesta de lista.
`mapListResponse` es necesario cuando la API devuelve una lista paginada en vez de un arreglo.

**2. El hook** — `domains/<x>/hooks/use-<x>.ts`

```ts
import { useCrud } from "@/shared/hooks/use-crud";
import { zonasService } from "../services/zonas.service";

export function useZonas() {
  return useCrud<Zona, ZonaInput, ZonaInput, ZonaListParams>(zonasService, "delivery-zones", {
    policy: "catalog",
  });
}
```

**3. La pantalla** — `pages/dashboard/<x>-page.tsx`

```tsx
const { data, loading, createItem, updateItem, deleteItem } = useZonas();
```

No hace falta duplicar la caché ni recargar la lista a mano. `use-crud` maneja la
consulta y la invalidación; los hooks del dominio pueden definir avisos de éxito,
reintentos y errores específicos. El interceptor traduce errores HTTP y permite
desactivar su aviso genérico con `skipErrorToast` cuando la pantalla muestra el error inline.

---

## Roles y rutas

```ts
ROLES = { COORDINADOR: 1, SUPERVISOR: 2, REPARTIDOR: 3 }
```

El **coordinador** concentra además toda la administración del sistema: usuarios,
catálogos, seguridad y auditoría (sección 4.2 del documento). **No existe un rol
"administrador" aparte.** El **cliente final no es un rol**: entra sin sesión.

| Zona | Rutas | Quién |
|---|---|---|
| Pública | `/` | Cualquiera |
| Portal del cliente | `/seguimiento`, `/seguimiento/:token` | Cualquiera con el token |
| Autenticación | `/login`, `/recuperar-password`, `/restablecer-password/:token` | Cualquiera |
| Panel — ambos roles | `/app/tablero` · `/despachos` · `/despachos/:id` · `/mapa` · `/repartidores` · `/incidencias` · `/reportes` | Coordinador y Supervisor |
| Panel — coordinador | `/app/planificacion` · `/recojos` · `/usuarios` · `/auditoria` · `/configuracion` · `/catalogos/*` | Solo Coordinador |
| Panel — supervisor | `/app/flota` · `/flota/:id/mantenimiento` | Solo Supervisor |

Entrar a una ruta sin permiso redirige a `/acceso-denegado`; sin sesión, a `/login`.

---

## Convenciones

- **Archivos en kebab-case**, componentes exportados en **PascalCase**.
  `vehiculo-form.tsx` → `export function VehiculoForm()`.
- Las páginas usan `export default`; todo lo demás, exportaciones con nombre.
- Los textos de cara al usuario van en español.
- Nunca `roles: [1]`. Siempre `ROLES.COORDINADOR`.
- Los colores salen de los tokens de `index.css`, nunca escritos a mano en un componente.

---

## Paleta

La paleta está definida por variables semánticas en `src/index.css`, con valores
adaptados al modo claro y oscuro. Los colores de marca son azul, turquesa y naranja;
los estados usan `--success`, `--warning`, `--info` y `--destructive`. Los mapas usan
los alias `--map-marker-*`, así sus marcadores siguen la misma paleta del tema.

---

## Estado actual

**Terminado y funcionando:**

- Toda la estructura de carpetas y los 11 dominios
- El routeo completo: 23 rutas, con lazy loading y control por rol
- Los tres layouts y el menú lateral filtrado por rol
- El cliente de API con sus interceptores, `use-crud` y el store de sesión
- La paleta y el tema claro/oscuro
- El dominio `auth`: login, logout y sus esquemas

**Pendiente:**

- Los **10 dominios** que no son `auth` tienen todos sus archivos creados pero **vacíos**
- Las **23 páginas** solo muestran su título y el RF que cubren
- Las piezas marcadas *(pendiente)* en las tablas de arriba
- No hay tests

---

## Crear un módulo nuevo

```bash
bash scripts/nuevo-dominio.sh <nombre>
```

Genera el dominio completo (barrel, tipos, esquemas, servicio y hook) más una página
con tabla, **y se engancha solo** a la ruta y al menú. Solo ajustas el icono y los
roles en `src/app/navigation.ts`.

---

## Pendientes con el equipo de backend

Cosas que están asumidas y hay que confirmar antes de avanzar:

1. **¿Qué devuelve `POST /auth/login`?** Hoy se asume `{ user, access_token }` con
   `user.rol.id` numérico. Si el rol viene como texto, hay que ajustar `roles.ts` y el guard.
2. **¿Hay refresh token en web?** Cambia el manejo del 401: en vez de cerrar sesión,
   habría que intentar renovar primero.
3. **¿Qué código HTTP devuelve una cuenta bloqueada?** (RF-A21). Hay que agregarlo al
   interceptor con su propio mensaje.
4. **¿La política de contraseñas la manda el backend?** El RF-A25 dice que es
   configurable, así que el `min(6)` actual del esquema es provisional.
5. **¿Cómo se llaman los eventos de WebSocket?** El tablero necesita saber en menos de
   3 segundos que cambió un despacho (RF-A06 y el RNF de rendimiento).
6. **¿El token en localStorage o en cookie httpOnly?** Hoy está en localStorage, que es
   vulnerable a XSS. Al ser un ERP con datos de clientes, conviene decidirlo ahora:
   cambiarlo después toca el store, el interceptor y el guard.
7. **Rutas reales de la API.** Los servicios asumen convenciones REST (`/despachos`,
   `/zonas`…) y que todo pasa por el API Gateway común del ERP.

---

## Ejemplo completo: crear y usar un dominio

Ejemplo real con **`flota` / vehículos** (RF-A15, RF-A30). Son 6 archivos en el
dominio y 1 página, siempre en este orden.

### 1. Los tipos — lo que devuelve el backend

`src/domains/flota/types/flota.types.ts`

```ts
export interface EstadoVehiculo {
  id: number;
  name: "active" | "maintenance" | "out_of_service";
}

export interface Vehiculo {
  id: number;
  type: string;
  model: string;
  plate: string;
  capacityKg: number;
  capacityM3: number;
  vehicleStatus: EstadoVehiculo;
  createdAt: string;
}

export type VehiculoInput = {
  type: string;
  model: string;
  plate: string;
  capacityKg: number;
  capacityM3: number;
};

export type VehiculoUpdateInput = Partial<VehiculoInput>;
export type VehiculoListParams = { page?: number; limit?: number; search?: string; vehicleStatusId?: number };
export type CambiarEstadoVehiculoInput = { status: EstadoVehiculo["name"]; reason: string };

export interface VehiclesResponse {
  data: Vehiculo[];
  meta: { page: number; limit: number; pages: number; total: number };
}
```

Esto refleja **el contrato del backend**, no lo que a la pantalla le viene cómodo.

### 2. El esquema — cómo se valida

`src/domains/flota/schemas/flota.schemas.ts`

```ts
import { z } from "zod";

const MAX_CAPACIDAD = 99999999.99;
const capacidadSchema = (etiqueta: string) =>
  z.coerce.number({ invalid_type_error: `${etiqueta} debe ser un número` })
    .positive(`${etiqueta} debe ser mayor que 0`)
    .max(MAX_CAPACIDAD, `${etiqueta} es demasiado grande`)
    .refine((value) => Number.isInteger(Math.round(value * 100)), `${etiqueta} admite hasta 2 decimales`);

export const vehiculoSchema = z.object({
  type: z.string().trim().min(1, "Ingresa el tipo de vehículo").max(50),
  model: z.string().trim().min(1, "Ingresa el modelo").max(100),
  plate: z.string().trim().toUpperCase().min(1, "Ingresa la placa").max(15),
  capacityKg: capacidadSchema("La capacidad en kg"),
  capacityM3: capacidadSchema("La capacidad en m³"),
});

export type VehiculoFormValues = z.infer<typeof vehiculoSchema>;
```

`z.coerce.number()` porque los inputs de HTML siempre devuelven texto.

### 3. El servicio — las llamadas HTTP

`src/domains/flota/services/vehiculos.service.ts`

```ts
import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import type {
  CambiarEstadoVehiculoInput,
  Vehiculo,
  VehiculoInput,
  VehiculoListParams,
  VehiculoUpdateInput,
  VehiclesResponse,
} from "../types/flota.types";

const crudService = createCrudService<
  Vehiculo, Vehiculo, VehiculoInput, VehiculoUpdateInput, VehiculoListParams, VehiclesResponse
>({
  endpoint: "/vehicles",
  requestConfig: { skipErrorToast: true },
  updateMethod: "put",
  mapListResponse: ({ data, meta }) => ({
    items: data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});

export const vehiculosService = {
  ...crudService,
  changeStatus: async (id: number, payload: CambiarEstadoVehiculoInput) => {
    const { data } = await api.patch<Vehiculo>(`/vehicles/${id}/status`, payload, { skipErrorToast: true });
    return data;
  },
};
```

No hay `try/catch`: el interceptor de `axios.ts` ya convierte cualquier error HTTP
en un aviso.

### 4. El hook — la lógica del módulo

`src/domains/flota/hooks/use-vehiculos.ts`

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCrud, type UseCrudOptions } from "@/shared/hooks/use-crud";
import { vehiculosService } from "../services/vehiculos.service";
import type { CambiarEstadoVehiculoInput, Vehiculo, VehiculoInput, VehiculoListParams, VehiculoUpdateInput } from "../types/flota.types";

export function useVehiculos(params?: VehiculoListParams, options: Omit<UseCrudOptions<VehiculoListParams, Vehiculo>, "params"> = {}) {
  const queryClient = useQueryClient();
  const result = useCrud<Vehiculo, VehiculoInput, VehiculoUpdateInput, VehiculoListParams>(vehiculosService, "vehicles", {
    ...options,
    params,
    notifications: {
      created: "Vehículo registrado correctamente",
      updated: "Vehículo actualizado correctamente",
      deleted: "Vehículo dado de baja correctamente",
      ...options.notifications,
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CambiarEstadoVehiculoInput }) => vehiculosService.changeStatus(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: result.keys.all });
      toast.success("Estado del vehículo actualizado.");
    },
  });

  return { ...result, changeStatus: changeStatusMutation.mutateAsync, isChangingStatus: changeStatusMutation.isPending };
}
```

`useCrud` ya trae listado, caché, crear, actualizar, borrar, invalidación y avisos
de éxito. Solo agregas lo extra.

### 5. Componentes y página

`VehiculoForm` conserva en el dominio la validación y los campos reales (`type`, `model`,
`plate`, `capacityKg`, `capacityM3`). Su `onSubmit` es asíncrono y recibe
`VehiculoFormValues`; la página abre el formulario dentro de un diálogo y compone
`VehiculosTable`, `CambiarEstadoDialog` y los estados de carga/error. Para copiar la
implementación completa y vigente, consulta `src/domains/flota/components/vehiculo-form.tsx`
y `src/pages/dashboard/flota-page.tsx`; evita reproducir una tabla o un diálogo reducido
que omita la edición, los cambios de estado y el manejo de errores del flujo actual.

### 6. El barrel — la puerta del módulo

`src/domains/flota/index.ts` publica los componentes, hooks y tipos que usan las páginas.
Importa desde `@/domains/flota`; deja servicios y detalles internos dentro del dominio.

### 7. La página — solo compone

La página usa `useVehiculos(params)` y consume `data` como arreglo, junto con `isLoading`,
`isError`, `createItem`, `updateItem` y `isSaving`. El hook también expone `changeStatus`;
la actualización específica usa `PATCH /vehicles/:id/status` y recibe `{ status, reason }`.
El ejemplo vivo está en `src/pages/dashboard/flota-page.tsx`.

### Lo que el linter rechaza

```ts
// ❌ import profundo: te saltas el barrel
import { vehiculosService } from "@/domains/flota/services/vehiculos.service";
//    error: Importa desde el barrel del dominio: @/domains/<dominio>

// ❌ un dominio importando de otro (dentro de domains/despachos/…)
import { useVehiculos } from "@/domains/flota";

// ❌ shared o domains importando de pages
import FlotaPage from "@/pages/dashboard/flota-page";
```

Si de verdad necesitas la segunda, es señal de que ese código va en `shared/`, o de
que los dos dominios eran uno solo.

### El flujo, de arriba abajo

```
FlotaPage          solo arma la pantalla
   ↓ useVehiculos()
use-vehiculos      decide qué datos pedir y cuándo refrescar
   ↓ useCrud()
use-crud           caché, invalidación, avisos de éxito
   ↓ vehiculosService
vehiculos.service  arma la URL y el payload
   ↓ api
axios.ts           mete el JWT, traduce el error, muestra el aviso
   ↓
BACKEND
```

Cada capa solo conoce a la de abajo. Por eso cambiar el backend toca un archivo,
no veinte.
