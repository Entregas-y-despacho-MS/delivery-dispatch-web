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
  despachoDetalle: { path: "despachos/:id", roles: BOTH },
  planificacion: { path: "planificacion", roles: COORDINATOR },
  recojos: { path: "recojos", roles: COORDINATOR },
  mapa: { path: "mapa", roles: BOTH },
  flota: { path: "flota", roles: SUPERVISOR },
  flotaMantenimiento: { path: "flota/:id/mantenimiento", roles: SUPERVISOR },
  repartidores: { path: "repartidores", roles: BOTH },
  incidencias: { path: "incidencias", roles: BOTH },
  reportes: { path: "reportes", roles: BOTH },
  zonas: { path: "catalogos/zonas", roles: COORDINATOR },
  nivelesServicio: { path: "catalogos/niveles-servicio", roles: COORDINATOR },
  motivosIncidencia: { path: "catalogos/motivos-incidencia", roles: COORDINATOR },
  motivosReprogramacion: { path: "catalogos/motivos-reprogramacion", roles: COORDINATOR },
  tiposIncidenteVehiculo: { path: "catalogos/tipos-incidente-vehiculo", roles: BOTH },
  usuarios: { path: "usuarios", roles: USER_READERS },
  auditoria: { path: "auditoria", roles: COORDINATOR },
  configuracion: { path: "configuracion", roles: ADMIN },
  // PORTAL_ROUTE_ANCHOR — no borres esta línea
} as const satisfies Record<string, PortalRoute>;

export type PortalRouteKey = keyof typeof PORTAL_ROUTES;

export function portalHref(key: PortalRouteKey): string {
  return `/app/${PORTAL_ROUTES[key].path}`;
}

/** El administrador no dispone del tablero operativo: su inicio es Usuarios. */
export function portalHomeHref(roleId: number): string {
  return portalHref(roleId === ROLES.ADMIN ? "usuarios" : "tablero");
}
