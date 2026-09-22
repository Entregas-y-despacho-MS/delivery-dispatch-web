import axios from "axios";
import { toast } from "sonner";
import { env } from "@/config/env";
import { useAuthStore } from "@/shared/store/use-auth-store";

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * La pantalla que hace la llamada muestra el error por su cuenta (dentro de un formulario
     * o de un aviso en la página). Evita el toast global para no repetir el mismo mensaje.
     * El 401 nunca se silencia: la sesión expirada siempre se avisa y se cierra.
     */
    skipErrorToast?: boolean;
  }
}

const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request: inyecta el token vigente en cada llamada.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: traduce los errores HTTP a un toast legible.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // El login muestra sus errores dentro del formulario (credenciales, bloqueo, 2FA…).
    // Sin este corte, un 401 por contraseña incorrecta se leería como "Sesión expirada"
    // y además cerraría una sesión que ni siquiera existe.
    if (error.config?.url?.startsWith("/auth/login")) return Promise.reject(error);

    let message = "Ocurrió un error inesperado";

    if (error.response) {
      // El backend manda un mensaje propio: úsalo si existe.
      const apiMessage = error.response.data?.message;
      switch (error.response.status) {
        case 400: message = apiMessage ?? "Petición inválida."; break;
        case 401:
          message = "Sesión expirada. Inicia sesión de nuevo.";
          useAuthStore.getState().logout();
          break;
        case 403: message = "No tienes permisos para esta acción."; break;
        case 404: message = "El recurso solicitado no existe."; break;
        case 422: message = apiMessage ?? "Los datos enviados son incorrectos."; break;
        case 500: message = "Error interno del servidor. Reintenta más tarde."; break;
        default: message = apiMessage ?? message;
      }
    } else if (error.request) {
      message = "No se pudo conectar con el servidor. Revisa tu internet.";
    }

    const silenciado = error.config?.skipErrorToast && error.response?.status !== 401;
    if (!silenciado) toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
