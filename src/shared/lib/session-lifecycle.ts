import { queryClient } from "./query-client";
import { useAuthStore } from "@/shared/store/use-auth-store";

/** Limpieza local común al logout manual, por inactividad y por expiración. */
export function closeSession(): boolean {
  const { user, access_token, refresh_token, logout } = useAuthStore.getState();
  if (!user && !access_token && !refresh_token) return false;

  // Desactivar primero la sesión evita que nuevas consultas reciban el token anterior.
  logout();
  void queryClient.cancelQueries();
  queryClient.clear();
  return true;
}
