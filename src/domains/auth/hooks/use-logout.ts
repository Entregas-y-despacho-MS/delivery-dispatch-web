import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { authService } from "../services/auth.service";

/** @param mensaje Aviso al cerrar la sesión (ej. el cierre por inactividad usa uno propio). */
export function useLogout(mensaje = "Sesión cerrada correctamente") {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return () => {
    // El token se lee ANTES de limpiar el store: el interceptor de axios corre después (es async)
    // y sin esto la petición salía sin Authorization, así que el backend no revocaba el refresh token.
    const accessToken = useAuthStore.getState().access_token ?? undefined;
    authService.logout(accessToken).catch(() => { /* si falla, igual limpiamos local */ });
    logout();
    toast.info(mensaje);
    navigate("/login", { replace: true });
  };
}
