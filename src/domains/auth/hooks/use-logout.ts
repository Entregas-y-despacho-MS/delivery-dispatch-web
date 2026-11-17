import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { closeSession } from "@/shared/lib/session-lifecycle";
import { authService } from "../services/auth.service";

/** @param mensaje Aviso al cerrar la sesión (ej. el cierre por inactividad usa uno propio). */
export function useLogout(mensaje = "Sesión cerrada correctamente") {
  const navigate = useNavigate();

  return () => {
    // El token se lee ANTES de limpiar el store: el interceptor de axios corre después (es async)
    // y sin esto la petición salía sin Authorization, así que el backend no revocaba el refresh token.
    const accessToken = useAuthStore.getState().access_token ?? undefined;
    if (!closeSession()) return;
    if (accessToken) {
      void authService.logout(accessToken).catch(() => { /* el cierre local ya terminó */ });
    }
    toast.info(mensaje);
    navigate("/login", { replace: true });
  };
}
