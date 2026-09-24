import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { LoginBrandPanel, RestablecerPasswordForm, useLoginDestination } from "@/domains/auth";
import { hasRole, ROLES_WEB } from "@/config/roles";
import { useAuthHydrated } from "@/shared/hooks/use-hydrated";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/**
 * Página para restablecer contraseña con token temporal (/reset-password?token=... o /restablecer-password).
 * Captura el token por query param (?token=xyz) o path param (/restablecer-password/:token).
 */
export default function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams();
  const params = useParams<{ token?: string }>();
  const token = searchParams.get("token") || params.token || "";

  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const destination = useLoginDestination();

  if (hydrated && user && hasRole(user.rol.id, ROLES_WEB)) {
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <LoginBrandPanel />
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <RestablecerPasswordForm token={token} />
      </main>
    </div>
  );
}
