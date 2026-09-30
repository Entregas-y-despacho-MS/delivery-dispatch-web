import axios, { CanceledError, isAxiosError } from "axios";
import { toast } from "sonner";
import { env } from "@/config/env";
import { getSessionGeneration, useAuthStore } from "@/shared/store/use-auth-store";
import { closeSession } from "./session-lifecycle";
import { parseApiError } from "./api-error";

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * El flujo que hace la llamada presenta el error por su cuenta. Evita avisos duplicados.
     * La sesión expirada nunca se silencia: siempre se avisa y se cierra.
     */
    skipErrorToast?: boolean;
    /** Uso interno (ST-16.3): la petición ya se reintentó una vez tras renovar el token. */
    _retry?: boolean;
    /** Generación de sesión que inició la petición; las respuestas antiguas se descartan. */
    _sessionGeneration?: number;
  }
}

const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Cliente sin interceptores, solo para POST /auth/refresh. Si usara `api`, un 401 del
// propio refresh volvería a entrar al interceptor y quedaría en bucle.
const refreshClient = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

/** Respuesta de POST /auth/refresh (AuthResponseDto): solo nos interesan los tokens. */
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Renovación silenciosa del token (ST-16.3) ────────────────────────────────────────────
// El backend ROTA el refresh token en cada uso y, si recibe uno ya usado, revoca TODAS las
// sesiones del usuario. Por eso nunca puede haber dos refresh en paralelo: la primera
// petición que recibe el 401 lanza la renovación y las demás esperan esa misma promesa
// (la "cola"). Cuando termina, cada una se reintenta con el token nuevo.
let refreshEnCurso: { generation: number; promise: Promise<string> } | null = null;

function renovarAccessToken(): Promise<string> {
  const generation = getSessionGeneration();
  if (refreshEnCurso?.generation === generation) return refreshEnCurso.promise;

  const refreshToken = useAuthStore.getState().refresh_token;
  if (!refreshToken) return Promise.reject(new Error("No hay refresh token guardado"));

  const promise = refreshClient.post<RefreshResponse>("/auth/refresh", { refreshToken })
    .then(({ data }) => {
      if (getSessionGeneration() !== generation || useAuthStore.getState().refresh_token !== refreshToken) {
        throw new CanceledError("La sesión cambió durante la renovación");
      }
      useAuthStore.setState({ access_token: data.accessToken, refresh_token: data.refreshToken });
      return data.accessToken;
    })
    .finally(() => {
      if (refreshEnCurso?.promise === promise) refreshEnCurso = null;
    });
  refreshEnCurso = { generation, promise };
  return promise;
}

/** Limpia la sesión; el ProtectedRoute redirige solo a /login al quedar `user` en null. */
function cerrarSesionExpirada(refreshError?: unknown) {
  const code = isAxiosError<{ error?: string }>(refreshError) ? refreshError.response?.data?.error : undefined;
  const message =
    code === "SESSION_EXPIRED"
      ? "Tu sesión se cerró por inactividad. Inicia sesión de nuevo."
      : "Sesión expirada. Inicia sesión de nuevo.";
  if (!closeSession()) return;
  // Mismo id: si varias peticiones caen a la vez, se muestra un solo aviso.
  toast.error(message, { id: "sesion-expirada" });
}

// Request: inyecta el token vigente en cada llamada.
api.interceptors.request.use((config) => {
  config._sessionGeneration = getSessionGeneration();
  const token = useAuthStore.getState().access_token;
  // El logout pasa explícitamente el token de la sesión que se está cerrando.
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: renueva el token si venció y traduce los errores HTTP a un toast legible.
api.interceptors.response.use(
  (response) => {
    if (response.config._sessionGeneration !== getSessionGeneration()) {
      return Promise.reject(new CanceledError("La sesión cambió durante la petición", response.config));
    }
    return response;
  },
  async (error) => {
    if (error.config?._sessionGeneration !== undefined &&
        error.config._sessionGeneration !== getSessionGeneration()) {
      return Promise.reject(error);
    }
    const url: string = error.config?.url ?? "";
    const parsed = parseApiError(error);
    if (parsed.kind === "cancelled") return Promise.reject(error);

    // El login muestra sus errores dentro del formulario (credenciales, bloqueo, 2FA…).
    // Sin este corte, un 401 por contraseña incorrecta se leería como "Sesión expirada"
    // y además cerraría una sesión que ni siquiera existe. El logout ya limpió la sesión
    // local antes de que llegue la respuesta, así que tampoco hay nada que avisar.
    if (url.startsWith("/auth/login") || url.startsWith("/auth/logout")) return Promise.reject(error);

    // 401 INVALID_TOKEN = access token vencido o inválido. Otros 401 (INVALID_CREDENTIALS en
    // change-password, INVALID_RESET_TOKEN…) son errores del formulario, no de la sesión.
    const tokenVencido = parsed.status === 401 && parsed.code === "INVALID_TOKEN";

    if (tokenVencido && error.config && !error.config._retry && useAuthStore.getState().refresh_token) {
      error.config._retry = true;
      try {
        const nuevoToken = await renovarAccessToken();
        if (error.config._sessionGeneration !== getSessionGeneration()) return Promise.reject(error);
        error.config.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(error.config);
      } catch (refreshError) {
        if (error.config._sessionGeneration !== getSessionGeneration()) return Promise.reject(error);
        cerrarSesionExpirada(refreshError);
        return Promise.reject(error);
      }
    }

    // Sin refresh token, o el reintento volvió a fallar: la sesión ya no sirve.
    if (tokenVencido) {
      cerrarSesionExpirada();
      return Promise.reject(error);
    }

    // Las consultas muestran su error junto al contenido; las acciones sin vista propia
    // usan toast, salvo cuando su flujo ya maneja la presentación.
    const method = error.config?.method?.toLowerCase();
    if (!error.config?.skipErrorToast && method !== "get" && method !== "head") {
      toast.error(parsed.message);
    }
    return Promise.reject(error);
  }
);

export default api;
