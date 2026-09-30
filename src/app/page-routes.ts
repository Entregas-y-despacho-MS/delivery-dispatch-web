import { lazy, type ComponentType } from "react";
import type { PortalRouteKey } from "@/config/portal-routes";

// ── Operación ──
const TableroPage = lazy(() => import("@/pages/dashboard/tablero-page"));
const DespachosPage = lazy(() => import("@/pages/dashboard/despachos-page"));
const DespachoDetallePage = lazy(() => import("@/pages/dashboard/despacho-detalle-page"));
const PlanificacionPage = lazy(() => import("@/pages/dashboard/planificacion-page"));
const RecojosPage = lazy(() => import("@/pages/dashboard/recojos-page"));

// ── Flota ──
const MapaFlotaPage = lazy(() => import("@/pages/dashboard/mapa-flota-page"));
const FlotaPage = lazy(() => import("@/pages/dashboard/flota-page"));
const FlotaMantenimientoPage = lazy(() => import("@/pages/dashboard/flota-mantenimiento-page"));
const RepartidoresPage = lazy(() => import("@/pages/dashboard/repartidores-page"));

// ── Control ──
const IncidenciasPage = lazy(() => import("@/pages/dashboard/incidencias-page"));
const ReportesPage = lazy(() => import("@/pages/dashboard/reportes-page"));

// ── Administración ──
const UsuariosPage = lazy(() => import("@/pages/dashboard/usuarios-page"));
const AuditoriaPage = lazy(() => import("@/pages/dashboard/auditoria-page"));
const ConfiguracionPage = lazy(() => import("@/pages/dashboard/configuracion-page"));

// ── Catálogos ──
const ZonasPage = lazy(() => import("@/pages/dashboard/catalogos/zonas-page"));
const NivelesServicioPage = lazy(() => import("@/pages/dashboard/catalogos/niveles-servicio-page"));
const MotivosIncidenciaPage = lazy(() => import("@/pages/dashboard/catalogos/motivos-incidencia-page"));
const MotivosReprogramacionPage = lazy(() => import("@/pages/dashboard/catalogos/motivos-reprogramacion-page"));
const TiposIncidenteVehiculoPage = lazy(() => import("@/pages/dashboard/catalogos/tipos-incidente-vehiculo-page"));
// LAZY_ANCHOR — no borres esta línea

export const PAGE_ROUTES = [
  ["tablero", TableroPage],
  ["despachos", DespachosPage],
  ["despachoDetalle", DespachoDetallePage],
  ["planificacion", PlanificacionPage],
  ["recojos", RecojosPage],
  ["mapa", MapaFlotaPage],
  ["flota", FlotaPage],
  ["flotaMantenimiento", FlotaMantenimientoPage],
  ["repartidores", RepartidoresPage],
  ["incidencias", IncidenciasPage],
  ["reportes", ReportesPage],
  ["zonas", ZonasPage],
  ["nivelesServicio", NivelesServicioPage],
  ["motivosIncidencia", MotivosIncidenciaPage],
  ["motivosReprogramacion", MotivosReprogramacionPage],
  ["tiposIncidenteVehiculo", TiposIncidenteVehiculoPage],
  ["usuarios", UsuariosPage],
  ["auditoria", AuditoriaPage],
  ["configuracion", ConfiguracionPage],
  // ROUTE_ANCHOR — no borres esta línea
] as const satisfies readonly (readonly [PortalRouteKey, ComponentType])[];
