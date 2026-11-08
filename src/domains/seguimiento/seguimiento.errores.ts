import { isAxiosError } from "axios";

import type { ApiError } from "@/shared/lib/api-error";

/** Cómo se ve la página cuando no se pudo leer el enlace. */
export type VistaError = "enlace-invalido" | "demasiados-intentos" | "error";

/** 404 = token desconocido o vencido (el back no dice cuál); 429 = límite por IP. */
export function vistaError(error: ApiError): VistaError {
  if (error.status === 404) return "enlace-invalido";
  if (error.status === 429) return "demasiados-intentos";
  return "error";
}

const MENSAJES: Record<string, string> = {
  TRACKING_LINK_NOT_FOUND: "El enlace no es válido o ya venció.",
  RESCHEDULE_NOT_AVAILABLE: "Ya no puedes elegir otro horario desde este enlace. Puedes solicitar un cambio.",
  VERIFICATION_CODE_RATE_LIMITED: "Pediste demasiados códigos. Espera unos minutos y vuelve a intentar.",
  VERIFICATION_CODE_NOT_SENT: "No pudimos enviar el código a tu correo. Intenta de nuevo en un momento.",
  VERIFICATION_UNAVAILABLE: "La verificación no está disponible ahora. Intenta de nuevo en un momento.",
  INVALID_VERIFICATION_CODE: "El código no es correcto.",
  VERIFICATION_CODE_EXPIRED: "El código venció o ya no sirve. Pide uno nuevo.",
  VERIFICATION_REQUIRED: "Tu verificación venció. Pide un código nuevo.",
  SLOT_NO_LONGER_AVAILABLE: "Ese horario ya se ocupó. Elige otro.",
  OSRM_UNAVAILABLE: "No pudimos calcular los horarios ahora. Intenta de nuevo en unos minutos.",
  CONFIRMATION_NOT_AVAILABLE: "Esta entrega ya no se puede confirmar desde el enlace.",
  CHANGE_REQUEST_NOT_AVAILABLE: "Ya no se puede solicitar un cambio para esta entrega.",
  RATING_NOT_ALLOWED: "Todavía no puedes calificar: la entrega aún no se completó.",
  RATING_ALREADY_SUBMITTED: "Esta entrega ya fue calificada. Gracias por tu opinión.",
};

/** Mensaje para el cliente. Nunca muestra el texto técnico del back. */
export function mensajeErrorSeguimiento(error: ApiError): string {
  const porCodigo = error.code ? MENSAJES[error.code] : undefined;
  if (porCodigo) return porCodigo;
  if (error.status === 429) return "Hiciste demasiados intentos. Espera unos minutos y vuelve a intentar.";
  if (error.kind === "network") return "No pudimos conectarnos. Revisa tu internet e intenta de nuevo.";
  return "No pudimos completar la acción. Intenta de nuevo en un momento.";
}

/** Intentos que quedan tras un código incorrecto (`details.attemptsLeft` del 400). */
export function intentosRestantes(error: unknown): number | null {
  if (!isAxiosError(error)) return null;
  const datos = error.response?.data as { details?: { attemptsLeft?: unknown } } | undefined;
  const intentos = datos?.details?.attemptsLeft;
  return typeof intentos === "number" ? intentos : null;
}

/** Errores tras los que el código o la prueba ya no sirven: hay que volver a pedir un código. */
const VOLVER_A_PEDIR = new Set(["VERIFICATION_CODE_EXPIRED", "VERIFICATION_REQUIRED"]);

export const requiereNuevoCodigo = (error: ApiError) => error.code !== undefined && VOLVER_A_PEDIR.has(error.code);

/** La reprogramación se cerró en el back (ventana vencida, sin intentos...): hay que recargar el pedido. */
export const reprogramacionCerrada = (error: ApiError) => error.code === "RESCHEDULE_NOT_AVAILABLE";
