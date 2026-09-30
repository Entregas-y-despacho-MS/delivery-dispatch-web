import {
  LayoutDashboard, ClipboardList, Route, RotateCcw,
  Map, Truck, Users, AlertTriangle, BarChart3,
  UserCog, MapPin, Gauge, ListX, CalendarClock, CarFront,
  ScrollText, Settings, PanelsTopLeft, type LucideIcon,
} from "lucide-react";
import { PORTAL_ROUTES, portalHref, type PortalRouteKey } from "@/config/portal-routes";
import type { RoleId } from "@/config/roles";

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
      navItem("planificacion", "Planificación", Route),
      navItem("recojos", "Recojos", RotateCcw),
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
      navItem("auditoria", "Auditoría", ScrollText),
      navItem("configuracion", "Configuración", Settings),
    ],
  },
];
