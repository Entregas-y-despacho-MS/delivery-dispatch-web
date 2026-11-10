import {
  LayoutDashboard, ClipboardList, Route, RotateCcw,
  Map, Truck, Users, AlertTriangle, BarChart3,
  UserCog, MapPin, Gauge, ListX, CalendarClock, CarFront,
  PanelsTopLeft, SlidersHorizontal, History, type LucideIcon,
  MessageSquareWarning,
} from "lucide-react";
import { PORTAL_ROUTES, portalHref, type PortalRouteKey } from "@/config/portal-routes";
import { hasRole, ROLES, type RoleId } from "@/config/roles";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: readonly RoleId[];
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

function navItem(key: PortalRouteKey, title: string, icon: LucideIcon): NavItem {
  return { title, href: portalHref(key), icon, roles: PORTAL_ROUTES[key].roles };
}

/** Metadatos de presentación; las rutas y los roles viven en PORTAL_ROUTES. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operación",
    icon: PanelsTopLeft,
    items: [
      navItem("tablero", "Tablero", LayoutDashboard),
      navItem("despachos", "Despachos", ClipboardList),
      navItem("historial", "Historial", History),
      navItem("solicitudes", "Solicitudes de cambio", MessageSquareWarning),
      navItem("planificacion", "Planificación", Route),
      navItem("recojos", "Devoluciones de clientes", RotateCcw),
      navItem("recojosProveedor", "Recojos a proveedores", Truck),
    ],
  },
  {
    label: "Flota",
    icon: Truck,
    items: [
      navItem("mapa", "Mapa", Map),
      navItem("flota", "Vehículos", Truck),
      navItem("repartidores", "Repartidores", Users),
    ],
  },
  {
    label: "Control",
    icon: AlertTriangle,
    items: [
      navItem("incidencias", "Incidencias", AlertTriangle),
      navItem("reportes", "Reportes", BarChart3),
    ],
  },
  {
    label: "Catálogos",
    icon: LayoutDashboard,
    items: [
      navItem("zonas", "Zonas de reparto", MapPin),
      navItem("nivelesServicio", "Niveles de servicio", Gauge),
      navItem("motivosIncidencia", "Motivos de incidencia", ListX),
      navItem("motivosReprogramacion", "Motivos de reprogramación", CalendarClock),
      navItem("tiposIncidenteVehiculo", "Fallas mecánicas", CarFront),
      // NAV_ANCHOR — no borres esta línea
    ],
  },
  {
    label: "Administración",
    icon: UserCog,
    items: [
      navItem("usuarios", "Usuarios", UserCog),
      navItem("parametros", "Parámetros operativos", SlidersHorizontal),
    ],
  },
];

const SUPERVISOR_NAV_GROUPS: NavGroup[] = [
  {
    label: "Supervisión",
    icon: Truck,
    items: [
      navItem("mapa", "Mapa", Map),
      navItem("flota", "Flota", Truck),
      navItem("kpis", "KPIs", BarChart3),
      navItem("alertas", "Alertas", AlertTriangle),
      navItem("tablero", "Tablero", LayoutDashboard),
      navItem("despachos", "Despachos", ClipboardList),
      navItem("reportes", "Reportes", BarChart3),
      navItem("umbrales", "Umbrales", SlidersHorizontal),
    ],
  },
];

/** Devuelve el menú permitido; el Supervisor tiene una vista reducida según ES-59. */
export function navigationForRole(roleId: number): NavGroup[] {
  const groups = roleId === ROLES.SUPERVISOR ? SUPERVISOR_NAV_GROUPS : NAV_GROUPS;
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => hasRole(roleId, item.roles)) }))
    .filter((group) => group.items.length > 0);
}
