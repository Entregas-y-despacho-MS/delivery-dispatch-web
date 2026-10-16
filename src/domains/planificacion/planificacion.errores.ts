import type { ApiError } from "@/shared/lib/api-error";

/** Acción sobre el lote que falló; cambia el texto genérico del mensaje. */
export type AccionLote = "aprobar" | "vehiculo" | "revisor";

/**
 * Conflictos en los que el lote que ve el coordinador ya no es el vigente:
 * hay que avisar y recargarlo, nunca reintentar con los datos viejos.
 */
const CODIGOS_RECARGA: readonly string[] = [
  "ROUTE_BATCH_VERSION_CONFLICT",
  "DISPATCH_VERSION_CONFLICT",
  "ROUTE_BATCH_NOT_PROVISIONAL",
  "ROUTE_BATCH_NOT_FOUND",
];

/** El error obliga a recargar el lote antes de seguir. */
export function requiereRecargarLote(error: ApiError): boolean {
  return error.code !== undefined && CODIGOS_RECARGA.includes(error.code);
}

const MENSAJES_POR_CODIGO: Record<string, string> = {
  ROUTE_BATCH_VERSION_CONFLICT: "El lote cambió mientras lo revisabas. Cargamos la versión vigente: revísala antes de aprobar.",
  DISPATCH_VERSION_CONFLICT: "Uno o más pedidos del lote cambiaron mientras lo revisabas. Cargamos la versión vigente: revísala antes de aprobar.",
  ROUTE_BATCH_NOT_PROVISIONAL: "Este lote ya no está provisional: alguien lo aprobó o cambió. Actualizamos la lista.",
  ROUTE_BATCH_NOT_FOUND: "El lote ya no existe. Actualizamos la lista.",
  ROUTE_BATCH_REVIEWER_MISMATCH: "Solo el coordinador asignado a este lote puede aprobarlo.",
  ROUTE_BATCH_VEHICLE_REQUIRED: "Asigna un vehículo al lote antes de aprobar las promesas.",
  ROUTE_BATCH_HAS_NO_APPROVALS: "Debe quedar al menos un pedido en el lote para aprobarlo.",
  ROUTE_CAPACITY_EXCEEDED: "La carga del lote no entra en el vehículo (peso, volumen o medidas de algún bulto).",
  VEHICLE_NOT_FOUND: "El vehículo elegido ya no existe.",
  ROUTE_BATCH_REVIEWER_NOT_ELIGIBLE: "Solo puedes pasar el lote a un coordinador o supervisor activo.",
};

const TEXTO_ACCION: Record<AccionLote, string> = {
  aprobar: "No se pudieron aprobar las promesas del lote.",
  vehiculo: "No se pudo cambiar el vehículo del lote.",
  revisor: "No se pudo reasignar el lote.",
};

/** Mensaje para el coordinador cuando el back rechaza una acción sobre el lote. */
export function mensajeErrorLote(error: ApiError, accion: AccionLote): string {
  const porCodigo = error.code ? MENSAJES_POR_CODIGO[error.code] : undefined;
  if (porCodigo) return porCodigo;
  if (error.kind === "forbidden") return "No tienes permisos para esta acción sobre el lote.";
  return `${TEXTO_ACCION[accion]} ${error.message}`;
}
