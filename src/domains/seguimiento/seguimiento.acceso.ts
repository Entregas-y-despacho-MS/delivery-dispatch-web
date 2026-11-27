import type { ApiError } from "@/shared/lib/api-error";

/*
 * Reglas del acceso por código de seguimiento (ST-309.2). Todo lo que ve el cliente es igual exista o no el
 * código: ningún texto dice «no existe», «sin correo» o «ya usado».
 */

/** Mismos límites que el back (ST-309.1): espera entre envíos y tamaño del código. */
export const ESPERA_REENVIO_S = 60;
export const MAX_CODIGO_SEGUIMIENTO = 40;
const OTP = /^\d{6}$/;

/** «dsp-2026-00001 » → «DSP-2026-00001». El back normaliza igual, así comparten límites. */
export const normalizarCodigoSeguimiento = (valor: string) => valor.trim().toUpperCase();

/** Solo tamaño: la forma no se valida en el front, para no dar una respuesta distinta a un código mal escrito. */
export function problemaCodigoSeguimiento(valor: string): string | null {
  const codigo = normalizarCodigoSeguimiento(valor);
  if (!codigo) return "Escribe el código de seguimiento de tu pedido.";
  if (codigo.length > MAX_CODIGO_SEGUIMIENTO) return `El código tiene como máximo ${MAX_CODIGO_SEGUIMIENTO} caracteres.`;
  return null;
}

export const esCodigoUnSoloUso = (valor: string) => OTP.test(valor);

/** Solo dígitos y hasta 6, para que pegar «482 913» funcione. */
export const limpiarCodigoUnSoloUso = (valor: string) => valor.replace(/\D/g, "").slice(0, 6);

/** El mensaje tras pedir el código: nunca confirma que se envió ni a qué correo. */
export function textoCodigoPedido(expiraEnSegundos: number): string {
  const minutos = Math.max(1, Math.round(expiraEnSegundos / 60));
  return `Si el código de seguimiento es correcto y tiene un correo registrado, te enviamos un código de 6 dígitos. Vence en ${minutos} min.`;
}

/** Segundos que faltan para poder pedir otro código; 0 si ya se puede. */
export function segundosParaReenviar(pedidoEn: number | null, ahora: number): number {
  if (pedidoEn === null) return 0;
  return Math.max(0, Math.ceil((pedidoEn + ESPERA_REENVIO_S * 1000 - ahora) / 1000));
}

/** La sesión venció por hora (el back responde 401 después, pero no hace falta esperarlo). */
export const sesionVencida = (expiraEn: string, ahora: number) => new Date(expiraEn).getTime() <= ahora;

/** Cómo sigue la pantalla tras un error. */
export type DesenlaceAcceso = "reintentar" | "pedir-otro" | "esperar" | "sesion-vencida";

export function desenlaceAcceso(error: ApiError): DesenlaceAcceso {
  if (error.status === 401 || error.code === "TRACKING_SESSION_INVALID") return "sesion-vencida";
  if (error.status === 429) return "esperar";
  if (error.code === "INVALID_ACCESS_CODE") return "pedir-otro";
  return "reintentar";
}

const MENSAJES: Record<string, string> = {
  // Una sola respuesta para código inexistente, vencido, usado o incorrecto (no se puede saber cuál).
  INVALID_ACCESS_CODE: "Los datos no son válidos. Revisa el código de seguimiento y el código de 6 dígitos, o pide uno nuevo.",
  TRACKING_ACCESS_RATE_LIMITED: "Hiciste demasiados intentos. Espera unos minutos y vuelve a intentar.",
  TOO_MANY_REQUESTS: "Hiciste demasiados intentos. Espera unos minutos y vuelve a intentar.",
  VERIFICATION_UNAVAILABLE: "La verificación no está disponible ahora. Intenta de nuevo en un momento.",
  TRACKING_SESSION_INVALID: "Tu acceso venció. Vuelve a verificarte para seguir viendo tu pedido.",
};

/** Mensaje para el cliente. Nunca el texto técnico del back. */
export function mensajeErrorAcceso(error: ApiError): string {
  const porCodigo = error.code ? MENSAJES[error.code] : undefined;
  if (porCodigo) return porCodigo;
  if (error.status === 400) return MENSAJES.INVALID_ACCESS_CODE;
  if (error.status === 401) return MENSAJES.TRACKING_SESSION_INVALID;
  if (error.status === 429) return MENSAJES.TOO_MANY_REQUESTS;
  if (error.kind === "network") return "No pudimos conectarnos. Revisa tu internet e intenta de nuevo.";
  return "No pudimos completar la acción. Intenta de nuevo en un momento.";
}
