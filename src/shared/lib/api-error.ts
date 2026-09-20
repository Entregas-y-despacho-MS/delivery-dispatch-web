import { isAxiosError } from "axios";

export interface ApiError {
  /** Código HTTP. Es undefined si nunca hubo respuesta (sin red, servidor caído, CORS). */
  status?: number;
  /** Código de dominio del backend (ACCOUNT_LOCKED, TOTP_REQUIRED…) o el genérico (BAD_REQUEST…). */
  code?: string;
  message: string;
}

/**
 * Normaliza un error de axios al formato que devuelve el HttpExceptionFilter del backend:
 * { statusCode, error, message, path, timestamp }.
 * `error` trae el código de dominio; `message` puede ser texto o una lista (class-validator).
 */
export function parseApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string | string[] } | undefined;
    const message = Array.isArray(data?.message) ? data.message.join(". ") : data?.message;
    return {
      status: error.response?.status,
      code: data?.error,
      message: message ?? error.message,
    };
  }
  return { message: error instanceof Error ? error.message : "Ocurrió un error inesperado" };
}
