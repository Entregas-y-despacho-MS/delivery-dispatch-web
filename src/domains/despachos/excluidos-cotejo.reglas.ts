import type { ApiError } from "@/shared/lib/api-error";
import type { ExcluidoCotejo } from "./excluidos-cotejo.types";

/** Lo que ve el coordinador para identificar la parada: el código de seguimiento o, si no tiene, la referencia. */
export const codigoParada = (p: Pick<ExcluidoCotejo, "trackingCode" | "sourceOrderRef">) => p.trackingCode ?? p.sourceOrderRef;

/** Estados en los que el coordinador puede cancelar (antes de que salga la ruta, ST-241.1). */
const CANCELABLES = ["pending", "address_review", "in_planning", "scheduled", "assigned"];
export const puedeCancelar = (estado: string) => CANCELABLES.includes(estado);

/** Por qué no se puede cancelar, para mostrarlo junto al botón deshabilitado. */
export const motivoNoCancelable = (estado: string): string | null =>
  puedeCancelar(estado) ? null : "Solo se cancela antes de que salga la ruta (pendiente, en planificación, programado o asignado).";

export const LIMITE_CAUSAL = 500;

const MOTIVOS_FALLA: Record<string, string> = {
  missing: "Falta el bulto",
  damaged: "Bulto dañado",
  does_not_fit: "No cabe en el vehículo",
};
export const etiquetaMotivoFalla = (motivo: string) => MOTIVOS_FALLA[motivo] ?? motivo;

const MENSAJES: Record<string, string> = {
  DISPATCH_CANCEL_NOT_ALLOWED: "Este despacho ya no se puede cancelar: la ruta salió o el despacho cambió de estado.",
  DISPATCH_TYPE_NOT_SUPPORTED: "Los recojos se cancelan desde su propio flujo, no desde aquí.",
  DISPATCH_CHANGED_CONCURRENTLY: "El despacho cambió mientras lo revisabas. Actualizamos los datos: revisa y vuelve a intentar.",
  DISPATCH_NOT_FOUND: "Este despacho ya no existe.",
  ROUTE_BATCH_NOT_IN_EXECUTION: "La ruta de esta parada ya no está en curso: no hace falta marcarla como resuelta.",
  COTEJO_DISPATCH_NOT_ASSIGNED: "Esta parada ya fue reprogramada o cancelada.",
  COTEJO_EXCLUSION_NOT_PENDING: "Esta parada ya estaba resuelta.",
};

/** Mensaje para el coordinador ante un error de cancelar o de marcar resuelto. */
export function mensajeErrorAccionCotejo(error: ApiError): string {
  if (error.code && MENSAJES[error.code]) return MENSAJES[error.code];
  if (error.kind === "validation" && error.validationMessages.length > 0) return `Revisa los datos: ${error.validationMessages.join(" ")}`;
  if (error.kind === "forbidden") return "Solo el coordinador puede hacer esta acción.";
  if (error.kind === "not-found") return MENSAJES.DISPATCH_NOT_FOUND;
  return `No se pudo completar la acción. ${error.message}`;
}

/** Tras un 404 o un 409 lo que se ve ya no es vigente: hay que recargar. */
export const requiereRecargarCotejo = (error: ApiError) => error.status === 404 || error.status === 409;
