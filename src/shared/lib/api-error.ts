import { isAxiosError, isCancel } from "axios";

export type ApiErrorKind =
  | "cancelled"
  | "network"
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "rate-limit"
  | "server"
  | "unknown";

export interface ApiError {
  kind: ApiErrorKind;
  /** Código HTTP; no existe cuando la petición no recibió respuesta. */
  status?: number;
  /** Código estable enviado por el backend, distinto del texto para el usuario. */
  code?: string;
  message: string;
  /** Mensajes individuales de class-validator, si el backend devolvió una lista. */
  validationMessages: string[];
  /** Solo los fallos transitorios pueden reintentarse automáticamente. */
  retryable: boolean;
}

const DEFAULT_MESSAGE = "Ocurrió un error inesperado. Inténtalo de nuevo.";

function apiError(kind: ApiErrorKind, message: string, status?: number, code?: string, validationMessages: string[] = []): ApiError {
  return { kind, status, code, message, validationMessages, retryable: kind === "network" || kind === "server" };
}

/**
 * Interpreta el contrato del HttpExceptionFilter:
 * { statusCode, error, message, path, timestamp }.
 * Las reglas de negocio deben usar `code`, nunca buscar palabras en `message`.
 */
export function parseApiError(error: unknown): ApiError {
  if (isCancel(error)) return apiError("cancelled", "La petición fue cancelada.");

  if (!isAxiosError(error)) {
    return apiError("unknown", DEFAULT_MESSAGE);
  }

  const status = error.response?.status;
  if (status === undefined) {
    if (error.request || error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
      return apiError("network", error.code === "ECONNABORTED"
        ? "Se agotó el tiempo de espera. Inténtalo de nuevo."
        : "No se pudo conectar con el servidor. Revisa tu conexión.");
    }
    return apiError("unknown", DEFAULT_MESSAGE);
  }

  const data = error.response?.data;
  const body = data && typeof data === "object" && !Array.isArray(data)
    ? data as { error?: unknown; message?: unknown }
    : undefined;
  const code = typeof body?.error === "string" ? body.error : undefined;
  const validationMessages = Array.isArray(body?.message)
    ? body.message.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (status === 400 || status === 422) {
    const detail = validationMessages.length > 0
      ? ` ${validationMessages.join(". ")}`
      : typeof body?.message === "string" && body.message.trim() ? ` ${body.message}` : "";
    return apiError("validation", `El servidor rechazó los datos.${detail}`, status, code, validationMessages);
  }
  if (status === 401) return apiError("unauthorized", "No autorizado. Inicia sesión de nuevo si es necesario.", status, code);
  if (status === 403) return apiError("forbidden", "No tienes permisos para esta acción.", status, code);
  if (status === 404) return apiError("not-found", "El recurso solicitado ya no existe.", status, code);
  if (status === 409) return apiError("conflict", "La operación entra en conflicto con datos existentes.", status, code);
  if (status === 429) return apiError("rate-limit", "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.", status, code);
  if (status >= 500) return apiError("server", "El servidor no pudo completar la operación. Inténtalo más tarde.", status, code);

  const message = typeof body?.message === "string" && body.message.trim() ? body.message : DEFAULT_MESSAGE;
  return apiError("unknown", message, status, code);
}
