import type { PropsWithChildren } from "react";

import { hasRole, type RoleId } from "@/config/roles";
import { useAuthStore } from "@/shared/store/use-auth-store";

/** Muestra acciones compartidas solo a los roles indicados; la API conserva la autorización real. */
export function RequireRole({ roles, children }: PropsWithChildren<{ roles: readonly RoleId[] }>) {
  const roleId = useAuthStore((state) => state.user?.rol.id);

  if (!hasRole(roleId, roles)) return null;
  return <>{children}</>;
}
