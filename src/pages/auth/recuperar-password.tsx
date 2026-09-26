import { Navigate } from "react-router-dom";

import { LoginBrandPanel, RecuperarPasswordForm, useLoginDestination } from "@/domains/auth";
import { hasRole, ROLES_WEB } from "@/config/roles";
import { useAuthHydrated } from "@/shared/hooks/use-hydrated";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/**
 * Página para solicitud de recuperación de contraseña (/forgot-password o /recuperar-password).
 * Redirige al panel principal si ya existe una sesión web activa.
 */
export default function RecuperarPasswordPage() {
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
        <RecuperarPasswordForm />
      </main>
    </div>
  );
}
