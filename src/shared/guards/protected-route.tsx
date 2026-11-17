import { Navigate, Outlet, useLocation } from "react-router-dom";
import { needsPasswordChange, useAuthStore } from "@/shared/store/use-auth-store";
import { useAuthHydrated } from "@/shared/hooks/use-hydrated";
import { LoadingScreen } from "@/shared/components/feedback/loading-screen";
import { hasRole, type RoleId } from "@/config/roles";

/**
 * Equivalente al middleware de Next, pero en el cliente.
 * Recuerda: esto es UX, no seguridad. Quien realmente autoriza es el backend.
 */
export function ProtectedRoute({ roles, passwordChangeOnly = false }: { roles?: readonly RoleId[]; passwordChangeOnly?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const location = useLocation();

  if (!hydrated) return <LoadingScreen label="Verificando sesión..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  const mustChangePassword = needsPasswordChange(user);
  if (mustChangePassword && !passwordChangeOnly) return <Navigate to="/cambiar-password" replace />;
  if (!mustChangePassword && passwordChangeOnly) return <Navigate to="/app" replace />;
  if (roles && !hasRole(user.rol.id, roles)) return <Navigate to="/acceso-denegado" replace />;

  return <Outlet />;
}
