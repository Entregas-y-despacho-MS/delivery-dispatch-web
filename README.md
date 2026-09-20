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
cp .env.example .env    # apunta VITE_API_URL a tu backend
npm run dev
```

Abre <http://localhost:3000>.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila TypeScript y genera `dist/` |
| `npm run typecheck` | Solo revisa tipos, sin compilar |
| `npm run lint` | oxlint, incluidas las reglas de frontera entre capas |
| `npm run preview` | Sirve el `dist/` ya compilado |

### Cómo probar el panel sin backend

Todavía no hay API, así que no puedes loguearte de verdad. Para entrar, abre la
consola del navegador y simula la sesión:

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
pages/  →  domains/  →  shared/
```

**Las flechas van en un solo sentido.** Una página importa de su dominio; un dominio
importa de `shared`. Nunca al revés. Si dos dominios necesitan lo mismo, eso sube a
`shared/`.

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
├── index.ts                 ← LA API PÚBLICA del módulo
├── <dominio>.types.ts          los tipos, tal como los devuelve el backend
├── <dominio>.schemas.ts        los esquemas Zod de validación
├── services/*.service.ts       las llamadas HTTP
├── hooks/use-*.ts              la lógica reutilizable del módulo
└── components/*.tsx            componentes que solo usa este dominio
```

**`index.ts` es la pieza clave.** Es el único archivo que otros pueden importar:

```ts
import { despachosService, useDespachos } from "@/domains/despachos";   // ✅
import { despachosService } from "@/domains/despachos/services/...";    // ❌ el linter lo rechaza
```

¿Por qué importa? Porque lo que **no** exportas en el barrel es privado del módulo.
Puedes reorganizar todo por dentro —renombrar archivos, partir servicios, mover
componentes— sin romper a nadie.

**Reglas de los dominios:**

1. Un dominio **no importa de otro dominio**. Si lo necesitas, o el código es
   realmente compartido (y sube a `shared/`), o los dos dominios eran uno solo.
2. Los esquemas Zod viven **dentro** de su dominio, no en una carpeta de validaciones aparte.
3. Los tipos reflejan el contrato del backend, no lo que la pantalla necesita.

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
| `auditoria` | Consulta, filtrado y exportación de logs — RF-A37, A38 |
| `configuracion` | Ventana horaria, umbrales de SLA, política de contraseñas — RF-A10, A20, A25 |

### `shared/` — lo reutilizable

Lo que usan dos o más dominios. Si algo aquí lo usa **un solo** dominio, está mal
ubicado: pertenece a ese dominio.

#### `shared/lib/` — la infraestructura

| Archivo | Para qué sirve |
|---|---|
| `axios.ts` | **El cliente de la API.** Pone el `baseURL`, inyecta el JWT en cada petición y traduce los errores HTTP a un aviso legible. En un 401 además cierra la sesión solo. |
| `base.service.ts` | `createCrudService<T>("/ruta")` genera los cinco métodos CRUD ya tipados. |
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
| `tracking-guard.tsx` | Validación del token de seguimiento del portal del cliente. *(pendiente)* |

#### `shared/components/`

| Carpeta | Qué contiene |
|---|---|
| `ui/` | Los 22 componentes de shadcn (botón, tabla, diálogo, sidebar…). **No los edites a mano** salvo que sepas lo que haces: se regeneran con el CLI de shadcn. |
| `layout/` | `public-layout` (sitio público), `dashboard-layout` (sidebar + cabecera del panel) y `tracking-layout` (portal del cliente, sin sidebar ni sesión). |
| `common/` | Piezas propias reutilizables: `page-header`, `data-table`, y *(pendientes)* `estado-badge`, `stat-card`, `map-view`. |
| `feedback/` | `error-boundary` (evita la pantalla en blanco si algo revienta), `loading-screen` y `empty-state`. |
| `theme-toggle.tsx` | El botón de claro/oscuro. |

---

## Las tres piezas que te ahorran el 80% del trabajo

Una pantalla CRUD completa son tres archivos y ningún `try/catch`:

**1. El servicio** — `domains/<x>/services/<x>.service.ts`

```ts
export const zonasService = {
  ...createCrudService<Zona>("/zonas"),
  // lo que no sea CRUD puro se agrega aquí
};
```

**2. El hook** — `domains/<x>/hooks/use-<x>.ts`

```ts
export function useZonas() {
  return useCrud<Zona>(zonasService, "zonas");
}
```

**3. La pantalla** — `pages/dashboard/<x>-page.tsx`

```tsx
const { data, loading, createItem, updateItem, deleteItem } = useZonas();
```

Sin `useState`, sin `useEffect`, sin manejo de errores, sin avisos de éxito, sin
recargar la tabla a mano. Todo eso ya está resuelto entre el interceptor de axios
y `use-crud`.

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

Naranja de marca sobre una base de gris cálido (`stone`).

| Token | Valor | Nota |
|---|---|---|
| `--primary` | `oklch(0.705 0.213 47.604)` | Naranja vivo, igual en claro y oscuro |
| `--primary-foreground` | Casi negro | Da **7.3:1** de contraste, pasa WCAG AA |

El naranja se reserva para la **marca**: botón principal, ítem activo del menú, foco
del teclado. Los estados tienen sus propios colores bien separados — verde para
entregado, **azul para "en camino"** (nunca naranja), rojo para no entregado. Así el
naranja nunca se confunde con una alerta.

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

`src/domains/flota/flota.types.ts`

```ts
import type { EstadoVehiculo } from "@/config/despachos";

export interface Vehiculo {
  id: number;
  placa: string;
  tipo: string;
  capacidad_kg: number;
  estado: EstadoVehiculo;
  repartidor_id: number | null;
  repartidor_nombre?: string;
}
```

Esto refleja **el contrato del backend**, no lo que a la pantalla le viene cómodo.

### 2. El esquema — cómo se valida

`src/domains/flota/flota.schemas.ts`

```ts
import { z } from "zod";
import { ESTADO_VEHICULO } from "@/config/despachos";

export const vehiculoSchema = z.object({
  placa: z.string().min(6, "La placa debe tener al menos 6 caracteres"),
  tipo: z.string().min(1, "Selecciona el tipo"),
  capacidad_kg: z.coerce.number().positive("Debe ser mayor a 0"),
  estado: z.enum([
    ESTADO_VEHICULO.ACTIVO,
    ESTADO_VEHICULO.EN_MANTENIMIENTO,
    ESTADO_VEHICULO.FUERA_DE_SERVICIO,
  ]),
});

export type VehiculoInput = z.infer<typeof vehiculoSchema>;
```

`z.coerce.number()` porque los inputs de HTML siempre devuelven texto.

### 3. El servicio — las llamadas HTTP

`src/domains/flota/services/vehiculos.service.ts`

```ts
import api from "@/shared/lib/axios";
import { createCrudService } from "@/shared/lib/base.service";
import type { EstadoVehiculo } from "@/config/despachos";
import type { Vehiculo } from "../flota.types";

export const vehiculosService = {
  // Esto ya da getAll, getOne, create, update y delete tipados
  ...createCrudService<Vehiculo>("/vehiculos"),

  // Lo que NO es CRUD puro se agrega aquí abajo
  cambiarDisponibilidad: async (id: number, estado: EstadoVehiculo) =>
    (await api.patch<Vehiculo>(`/vehiculos/${id}/estado`, { estado })).data,

  disponibles: async () =>
    (await api.get<Vehiculo[]>("/vehiculos", { params: { estado: "ACTIVO" } })).data,
};
```

No hay `try/catch`: el interceptor de `axios.ts` ya convierte cualquier error HTTP
en un aviso.

### 4. El hook — la lógica del módulo

`src/domains/flota/hooks/use-vehiculos.ts`

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCrud } from "@/shared/hooks/use-crud";
import { createQueryKeys } from "@/shared/lib/query-keys";
import type { EstadoVehiculo } from "@/config/despachos";
import { vehiculosService } from "../services/vehiculos.service";
import type { Vehiculo } from "../flota.types";

const keys = createQueryKeys("vehiculos");

export function useVehiculos() {
  const crud = useCrud<Vehiculo>(vehiculosService, "vehiculos");
  const queryClient = useQueryClient();

  // Solo hay que escribir a mano lo que se sale del CRUD
  const disponibilidad = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoVehiculo }) =>
      vehiculosService.cambiarDisponibilidad(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success("Disponibilidad actualizada");
    },
  });

  return { ...crud, cambiarDisponibilidad: disponibilidad.mutateAsync };
}
```

`useCrud` ya trae listado, caché, crear, actualizar, borrar, invalidación y avisos
de éxito. Solo agregas lo extra.

### 5. El componente del dominio

`src/domains/flota/components/vehiculo-form.tsx`

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { vehiculoSchema, type VehiculoInput } from "../flota.schemas";
import type { Vehiculo } from "../flota.types";

export function VehiculoForm({
  vehiculo,
  onSubmit,
  guardando,
}: {
  vehiculo?: Vehiculo;
  onSubmit: (values: VehiculoInput) => void;
  guardando?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<VehiculoInput>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: vehiculo ?? { estado: "ACTIVO" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="placa">Placa</Label>
        <Input id="placa" {...register("placa")} />
        {errors.placa && <p className="text-xs text-destructive">{errors.placa.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacidad_kg">Capacidad (kg)</Label>
        <Input id="capacidad_kg" type="number" {...register("capacidad_kg")} />
        {errors.capacidad_kg && (
          <p className="text-xs text-destructive">{errors.capacidad_kg.message}</p>
        )}
      </div>

      <Button type="submit" disabled={guardando} className="w-full">
        {guardando ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
```

Va en el dominio y no en `shared/` porque **solo `flota` lo usa**.

### 6. El barrel — la puerta del módulo

`src/domains/flota/index.ts`

```ts
// Esto y solo esto pueden importar los demás
export { vehiculosService } from "./services/vehiculos.service";
export { useVehiculos } from "./hooks/use-vehiculos";
export { VehiculoForm } from "./components/vehiculo-form";
export { vehiculoSchema, type VehiculoInput } from "./flota.schemas";
export type { Vehiculo } from "./flota.types";
```

### 7. La página — solo compone

`src/pages/dashboard/flota-page.tsx`

```tsx
import { useState } from "react";
import { useVehiculos, VehiculoForm, type Vehiculo, type VehiculoInput } from "@/domains/flota";
import { PageHeader } from "@/shared/components/common/page-header";
import { DataTable, type Column } from "@/shared/components/common/data-table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/components/ui/dialog";

export default function FlotaPage() {
  const { data, loading, createItem, deleteItem, isSaving } = useVehiculos();
  const [abierto, setAbierto] = useState(false);

  const columns: Column<Vehiculo>[] = [
    { header: "Placa", cell: "placa", className: "font-medium" },
    { header: "Tipo", cell: "tipo" },
    { header: "Capacidad", cell: (v) => `${v.capacidad_kg} kg` },
    {
      header: "Estado",
      cell: (v) => (
        <Badge variant={v.estado === "ACTIVO" ? "default" : "secondary"}>{v.estado}</Badge>
      ),
    },
    {
      header: "",
      cell: (v) => (
        <Button variant="ghost" size="sm" onClick={() => deleteItem(v.id)}>
          Eliminar
        </Button>
      ),
    },
  ];

  const guardar = async (values: VehiculoInput) => {
    await createItem(values);
    setAbierto(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehículos"
        description={`${data.length} en la flota`}
        action={
          <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
              <Button>Nuevo vehículo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar vehículo</DialogTitle>
              </DialogHeader>
              <VehiculoForm onSubmit={guardar} guardando={isSaving} />
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
```

Fíjate en lo que **no** está: ningún `useState` para los datos, ningún `useEffect`,
ningún `try/catch`, ninguna recarga manual de la tabla, ningún mensaje de éxito o
error. Todo eso ya lo resuelven el interceptor y `use-crud`.

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
