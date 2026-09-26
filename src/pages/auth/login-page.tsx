import { Navigate } from "react-router-dom";

import { LoginBrandPanel, LoginForm, useLoginDestination } from "@/domains/auth";
import { hasRole, ROLES_WEB } from "@/config/roles";
import { useAuthHydrated } from "@/shared/hooks/use-hydrated";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/** La página solo decide qué mostrar; el diseño vive en domains/auth/components. */
export default function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const destination = useLoginDestination();

  // Si ya hay sesión válida no tiene sentido ver el login.
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
        <LoginForm />
      </main>
    </div>
  );
}
