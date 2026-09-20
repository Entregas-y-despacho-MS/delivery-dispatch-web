import {
  LayoutDashboard, ClipboardList, Route, RotateCcw,
  Map, Truck, Wrench, Users, AlertTriangle, BarChart3,
  UserCog, MapPin, Gauge, ListX, CalendarClock, CarFront,
  ScrollText, Settings, type LucideIcon,
} from "lucide-react";
import { ROLES, type RoleId } from "@/config/roles";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: readonly RoleId[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const AMBOS = [ROLES.COORDINADOR, ROLES.SUPERVISOR] as const;
const COORD = [ROLES.COORDINADOR] as const;
const SUPER = [ROLES.SUPERVISOR] as const;

/**
 * El sidebar son datos, no UI. `nuevo-dominio.sh` inserta antes de NAV_ANCHOR.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operación",
    items: [
      { title: "Tablero",       href: "/app/tablero",       icon: LayoutDashboard, roles: AMBOS },
      { title: "Despachos",     href: "/app/despachos",     icon: ClipboardList,   roles: AMBOS },
      { title: "Planificación", href: "/app/planificacion", icon: Route,           roles: COORD },
      { title: "Recojos",       href: "/app/recojos",       icon: RotateCcw,       roles: COORD },
    ],
  },
  {
    label: "Flota",
    items: [
      { title: "Mapa",          href: "/app/mapa",          icon: Map,   roles: AMBOS },
      { title: "Vehículos",     href: "/app/flota",         icon: Truck, roles: SUPER },
      { title: "Repartidores",  href: "/app/repartidores",  icon: Users, roles: AMBOS },
    ],
  },
  {
    label: "Control",
    items: [
      { title: "Incidencias",   href: "/app/incidencias",   icon: AlertTriangle, roles: AMBOS },
      { title: "Reportes",      href: "/app/reportes",      icon: BarChart3,     roles: AMBOS },
    ],
  },
  {
    label: "Catálogos",
    items: [
      { title: "Zonas de reparto",     href: "/app/catalogos/zonas",                      icon: MapPin,        roles: COORD },
      { title: "Niveles de servicio",  href: "/app/catalogos/niveles-servicio",           icon: Gauge,         roles: COORD },
      { title: "Motivos de incidencia", href: "/app/catalogos/motivos-incidencia",        icon: ListX,         roles: COORD },
      { title: "Motivos de reprogramación", href: "/app/catalogos/motivos-reprogramacion", icon: CalendarClock, roles: COORD },
      { title: "Tipos de incidente",   href: "/app/catalogos/tipos-incidente-vehiculo",   icon: CarFront,      roles: COORD },
      // NAV_ANCHOR — no borres esta línea
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Usuarios",      href: "/app/usuarios",      icon: UserCog,    roles: COORD },
      { title: "Auditoría",     href: "/app/auditoria",     icon: ScrollText, roles: COORD },
      { title: "Configuración", href: "/app/configuracion", icon: Settings,   roles: COORD },
    ],
  },
];

export const ICONO_MANTENIMIENTO = Wrench;
