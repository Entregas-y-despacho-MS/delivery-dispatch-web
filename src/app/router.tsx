import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { PublicLayout } from "@/shared/components/layout/public-layout";
import { TrackingLayout } from "@/shared/components/layout/tracking-layout";
import { DashboardLayout } from "@/app/layouts/dashboard-layout";
import { ProtectedRoute } from "@/shared/guards/protected-route";
import { LoadingScreen } from "@/shared/components/feedback/loading-screen";
import { PageErrorBoundary } from "@/shared/components/feedback/page-error-boundary";
import { PORTAL_ROUTES, portalHomeHref } from "@/config/portal-routes";
import { PAGE_ROUTES } from "@/app/page-routes";
import { ROLES_WEB } from "@/config/roles";
import { useAuthStore } from "@/shared/store/use-auth-store";

function PortalHomeRedirect() {
  const roleId = useAuthStore((state) => state.user?.rol.id);
  return <Navigate to={portalHomeHref(roleId ?? 0)} replace />;
}

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
const CambiarPasswordPage = lazy(() => import("@/pages/auth/cambiar-password"));

function StandalonePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PageErrorBoundary />
    </Suspense>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
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
        <Route element={<StandalonePage />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
          <Route path="/forgot-password" element={<RecuperarPasswordPage />} />
          <Route path="/restablecer-password" element={<RestablecerPasswordPage />} />
          <Route path="/restablecer-password/:token" element={<RestablecerPasswordPage />} />
          <Route path="/reset-password" element={<RestablecerPasswordPage />} />
          <Route path="/reset-password/:token" element={<RestablecerPasswordPage />} />
          <Route path="/acceso-denegado" element={<AccesoDenegado />} />
        </Route>

        {/* El cambio obligatorio tiene una ruta autenticada fuera del panel. */}
        <Route element={<ProtectedRoute passwordChangeOnly />}>
          <Route element={<StandalonePage />}>
            <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
          </Route>
        </Route>


        {/* ─── Panel interno: el repartidor usa la app móvil, no entra aquí ─── */}
        <Route element={<ProtectedRoute roles={ROLES_WEB} />}>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<PortalHomeRedirect />} />
            {PAGE_ROUTES.map(([key, Page]) => (
              <Route key={key} element={<ProtectedRoute roles={PORTAL_ROUTES[key].roles} />}>
                <Route path={PORTAL_ROUTES[key].path} element={<Page />} />
              </Route>
            ))}
          </Route>
        </Route>

        <Route element={<StandalonePage />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
