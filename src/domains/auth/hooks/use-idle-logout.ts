import { useQueryClient } from "@tanstack/react-query";
import { useIdleTimeout } from "@/shared/hooks/use-idle-timeout";
import { useLogout } from "./use-logout";

/**
 * RF-A24: la sesión se cierra tras 30 min continuos sin actividad. Coincide con el
 * `session_inactivity_minutes` del backend, que rechaza el refresh pasado ese tiempo.
 */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
/** El aviso aparece a los 28 min: quedan 2 min de cuenta regresiva para extender la sesión. */
export const IDLE_WARNING_MS = 28 * 60 * 1000;

/** Cierre de sesión por inactividad con fase de aviso previa. */
export function useIdleLogout() {
  const queryClient = useQueryClient();
  const logout = useLogout("Tu sesión se cerró por inactividad.");

  // Purga completa: datos de sesión del navegador, caché de consultas y el store (vía useLogout,
  // que además revoca el refresh token en el backend y redirige a /login).
  const cerrarSesion = () => {
    try {
      sessionStorage.clear();
    } catch {
      /* storage bloqueado: no hay nada que limpiar */
    }
    queryClient.clear();
    logout();
  };

  const idle = useIdleTimeout({
    timeoutMs: IDLE_TIMEOUT_MS,
    warningMs: IDLE_WARNING_MS,
    onTimeout: cerrarSesion,
  });

  return {
    mostrarAviso: idle.isWarning,
    restanteMs: idle.remainingMs,
    extenderSesion: idle.reset,
    cerrarSesion,
  };
}
