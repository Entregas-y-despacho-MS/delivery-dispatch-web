import { Navigate } from "react-router-dom";

import { LoginBrandPanel, LoginForm, useLoginDestination } from "@/domains/auth";
import { hasRole, ROLES_WEB } from "@/config/roles";
import { useAuthHydrated } from "@/shared/hooks/use-hydrated";
import { useAuthStore } from "@/shared/store/use-auth-store";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      <LoginBrandPanel />
      <main className="flex items-center justify-center px-4 py-10">
        <LoginForm />
      </main>
    </div>
  );
}
