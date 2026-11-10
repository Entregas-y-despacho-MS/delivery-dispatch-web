import { ROLES, type RoleId } from "@/config/roles";

const BOTH = [ROLES.COORDINADOR, ROLES.SUPERVISOR] as const;
const COORDINATOR = [ROLES.COORDINADOR] as const;
const SUPERVISOR = [ROLES.SUPERVISOR] as const;
const ADMIN = [ROLES.ADMIN] as const;
const USER_READERS = [ROLES.ADMIN, ROLES.COORDINADOR] as const;

interface PortalRoute {
  path: string;
  roles: readonly RoleId[];
}

/** Rutas del panel y sus permisos. El router y el menú consumen este registro. */
export const PORTAL_ROUTES = {
  tablero: { path: "tablero", roles: BOTH },
  despachos: { path: "despachos", roles: BOTH },
  historial: { path: "historial", roles: COORDINATOR },
  solicitudesCambio: { path: "solicitudes-cambio", roles: COORDINATOR },
  despachoDetalle: { path: "despachos/:id", roles: BOTH },
  solicitudes: { path: "solicitudes", roles: COORDINATOR },
  planificacion: { path: "planificacion", roles: COORDINATOR },
  recojos: { path: "recojos", roles: COORDINATOR },
  recojosProveedor: { path: "recojos-proveedor", roles: COORDINATOR },
  mapa: { path: "mapa", roles: BOTH },
  flota: { path: "flota", roles: SUPERVISOR },
  kpis: { path: "kpis", roles: SUPERVISOR },
  alertas: { path: "alertas", roles: SUPERVISOR },
  umbrales: { path: "umbrales", roles: SUPERVISOR },
  // Historial de toda la flota (ST-64.2). Desde un vehículo se entra por la ruta con :id, que abre este
  // mismo historial con ese vehículo ya filtrado.
  flotaMantenimientos: { path: "flota/mantenimiento", roles: SUPERVISOR },
  flotaMantenimiento: { path: "flota/:id/mantenimiento", roles: SUPERVISOR },
  repartidores: { path: "repartidores", roles: COORDINATOR },
  incidencias: { path: "incidencias", roles: COORDINATOR },
  reportes: { path: "reportes", roles: BOTH },
  zonas: { path: "catalogos/zonas", roles: COORDINATOR },
  nivelesServicio: { path: "catalogos/niveles-servicio", roles: COORDINATOR },
  motivosIncidencia: { path: "catalogos/motivos-incidencia", roles: COORDINATOR },
  motivosReprogramacion: { path: "catalogos/motivos-reprogramacion", roles: COORDINATOR },
  tiposIncidenteVehiculo: { path: "catalogos/tipos-incidente-vehiculo", roles: COORDINATOR },
  usuarios: { path: "usuarios", roles: USER_READERS },
  auditoria: { path: "auditoria", roles: COORDINATOR },
  configuracion: { path: "configuracion", roles: ADMIN },
  // El back solo deja guardar parámetros al coordinador (PUT /settings): página propia, aparte de Configuración.
  parametros: { path: "configuracion/parametros", roles: COORDINATOR },
  // PORTAL_ROUTE_ANCHOR — no borres esta línea
} as const satisfies Record<string, PortalRoute>;

export type PortalRouteKey = keyof typeof PORTAL_ROUTES;

export function portalHref(key: PortalRouteKey): string {
  return `/app/${PORTAL_ROUTES[key].path}`;
}

/** El supervisor inicia en el mapa; el administrador en Usuarios. */
export function portalHomeHref(roleId: number): string {
  if (roleId === ROLES.SUPERVISOR) return portalHref("mapa");
  return portalHref(roleId === ROLES.ADMIN ? "usuarios" : "tablero");
}
