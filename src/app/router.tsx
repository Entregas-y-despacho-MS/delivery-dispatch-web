import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "@/shared/components/layout/public-layout";
import { TrackingLayout } from "@/shared/components/layout/tracking-layout";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/shared/guards/protected-route";
import { LoadingScreen } from "@/shared/components/feedback/loading-screen";
import { ROLES, ROLES_WEB } from "@/config/roles";

// ── Público ──
const HomePage = lazy(() => import("@/pages/public/home-page"));
const NotFound = lazy(() => import("@/pages/public/not-found"));
const SeguimientoBuscarPage = lazy(() => import("@/pages/public/seguimiento-buscar"));
const SeguimientoDetallePage = lazy(() => import("@/pages/public/seguimiento-detalle"));

// ── Autenticación ──
const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const AccesoDenegado = lazy(() => import("@/pages/auth/acceso-denegado"));
const RecuperarPasswordPage = lazy(() => import("@/pages/auth/recuperar-password"));
const RestablecerPasswordPage = lazy(() => import("@/pages/auth/restablecer-password"));

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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ─── Sitio público ─── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* ─── Portal del cliente final: sin login, con token (RF-U14) ─── */}
          <Route element={<TrackingLayout />}>
            <Route path="/seguimiento" element={<SeguimientoBuscarPage />} />
            <Route path="/seguimiento/:token" element={<SeguimientoDetallePage />} />
          </Route>

          {/* ─── Autenticación ─── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
          <Route path="/restablecer-password/:token" element={<RestablecerPasswordPage />} />
          <Route path="/acceso-denegado" element={<AccesoDenegado />} />

          {/* ─── Panel interno: el repartidor usa la app móvil, no entra aquí ─── */}
          <Route element={<ProtectedRoute roles={ROLES_WEB} />}>
            <Route path="/app" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/app/tablero" replace />} />

              {/* Coordinador y supervisor */}
              <Route path="tablero" element={<TableroPage />} />
              <Route path="despachos" element={<DespachosPage />} />
              <Route path="despachos/:id" element={<DespachoDetallePage />} />
              <Route path="mapa" element={<MapaFlotaPage />} />
              <Route path="repartidores" element={<RepartidoresPage />} />
              <Route path="incidencias" element={<IncidenciasPage />} />
              <Route path="reportes" element={<ReportesPage />} />

              {/* Solo coordinador */}
              <Route element={<ProtectedRoute roles={[ROLES.COORDINADOR]} />}>
                <Route path="planificacion" element={<PlanificacionPage />} />
                <Route path="recojos" element={<RecojosPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="auditoria" element={<AuditoriaPage />} />
                <Route path="configuracion" element={<ConfiguracionPage />} />
                <Route path="catalogos/zonas" element={<ZonasPage />} />
                <Route path="catalogos/niveles-servicio" element={<NivelesServicioPage />} />
                <Route path="catalogos/motivos-incidencia" element={<MotivosIncidenciaPage />} />
                <Route path="catalogos/motivos-reprogramacion" element={<MotivosReprogramacionPage />} />
                <Route path="catalogos/tipos-incidente-vehiculo" element={<TiposIncidenteVehiculoPage />} />
              </Route>

              {/* Solo supervisor de flota */}
              <Route element={<ProtectedRoute roles={[ROLES.SUPERVISOR]} />}>
                <Route path="flota" element={<FlotaPage />} />
                <Route path="flota/:id/mantenimiento" element={<FlotaMantenimientoPage />} />
              </Route>

              {/* ROUTE_ANCHOR — no borres esta línea */}
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
