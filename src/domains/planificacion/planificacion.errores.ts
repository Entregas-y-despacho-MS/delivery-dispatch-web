import type { ApiError } from "@/shared/lib/api-error";

/** Acción sobre el lote que falló; cambia el texto genérico del mensaje. */
export type AccionLote = "aprobar" | "aprobar-final" | "vehiculo" | "conductor" | "revisor";

/**
 * Conflictos en los que el lote que ve el coordinador ya no es el vigente:
 * hay que avisar y recargarlo, nunca reintentar con los datos viejos.
 */
const CODIGOS_RECARGA: readonly string[] = [
  "ROUTE_BATCH_VERSION_CONFLICT",
  "DISPATCH_VERSION_CONFLICT",
  "ROUTE_BATCH_NOT_PROVISIONAL",
  "ROUTE_BATCH_NOT_FOUND",
  "ROUTE_BATCH_NOT_PENDING_FINAL_REVIEW",
  "ROUTE_BATCH_NOT_CORRECTABLE",
  // Recursos compartidos: otro lote tomó el vehículo, el conductor o un pedido mientras se revisaba.
  "ROUTE_BATCH_RESOURCE_CONFLICT",
  "ROUTE_BATCH_DRIVER_NOT_AVAILABLE",
  "DISPATCH_ORDER_IN_MULTIPLE_BATCHES",
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
  ROUTE_BATCH_VEHICLE_REQUIRED: "Asigna un vehículo al lote antes de aprobarlo.",
  ROUTE_BATCH_HAS_NO_APPROVALS: "Debe quedar al menos un pedido en el lote para aprobarlo.",
  ROUTE_CAPACITY_EXCEEDED: "La carga del lote no entra en el vehículo (peso, volumen o medidas de algún bulto).",
  VEHICLE_NOT_FOUND: "El vehículo elegido ya no existe.",
  ROUTE_BATCH_REVIEWER_NOT_ELIGIBLE: "Solo puedes pasar el lote a un coordinador o supervisor activo.",
  // 2.ª aprobación (ST-51.2)
  ROUTE_BATCH_NOT_PENDING_FINAL_REVIEW: "Este lote ya no está listo para la aprobación final: alguien lo aprobó o lo devolvió a validación. Actualizamos la lista.",
  ROUTE_BATCH_DRIVER_REQUIRED: "Asigna un conductor propuesto antes de aprobar el lote.",
  ROUTE_BATCH_DRIVER_NOT_AVAILABLE: "El conductor propuesto está inactivo o ya tiene otra ruta ese día.",
  ROUTE_BATCH_VEHICLE_NOT_ACTIVE: "El vehículo asignado no está activo.",
  ROUTE_BATCH_RESOURCE_CONFLICT: "El vehículo asignado ya no está disponible para esa fecha.",
  DISPATCH_NOT_READY_FOR_FINAL_APPROVAL: "Un pedido tiene la dirección incompleta o la franja prometida no es válida. Corrígelo antes de aprobar.",
  DISPATCH_PACKAGES_REQUIRED: "Todos los pedidos deben tener sus bultos registrados antes de aprobar.",
  DISPATCH_ORDER_IN_MULTIPLE_BATCHES: "Un pedido ya pertenece a otro lote activo.",
  // Corrección del lote (ST-51.6)
  ROUTE_BATCH_NOT_CORRECTABLE: "Este lote ya no se puede corregir: ya fue confirmado. Actualizamos la lista.",
  PLANNING_SETTINGS_MISSING: "No se puede validar la corrección: faltan parámetros de planificación (tiempo por parada y margen).",
  OSRM_UNAVAILABLE: "El motor de rutas no respondió a tiempo. Intenta de nuevo en unos minutos.",
};

const TEXTO_ACCION: Record<AccionLote, string> = {
  aprobar: "No se pudieron aprobar las promesas del lote.",
  "aprobar-final": "No se pudo aprobar el lote.",
  vehiculo: "No se pudo cambiar el vehículo del lote.",
  conductor: "No se pudo cambiar el conductor del lote.",
  revisor: "No se pudo reasignar el lote.",
};

/** Mensaje para el coordinador cuando el back rechaza una acción sobre el lote. */
export function mensajeErrorLote(error: ApiError, accion: AccionLote): string {
  const porCodigo = error.code ? MENSAJES_POR_CODIGO[error.code] : undefined;
  if (porCodigo) return porCodigo;
  if (error.kind === "forbidden") return "No tienes permisos para esta acción sobre el lote.";
  return `${TEXTO_ACCION[accion]} ${error.message}`;
}
