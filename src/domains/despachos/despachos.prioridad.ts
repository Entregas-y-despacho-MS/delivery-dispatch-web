import type { ApiError } from "@/shared/lib/api-error";
import type { PrioridadPedido } from "./despachos.types";

/** Estados en los que el back acepta cambiar la prioridad (ST-58.2). */
export const ESTADOS_CON_PRIORIDAD_EDITABLE: readonly string[] = ["pending", "in_planning", "scheduled"];

export const puedeCambiarPrioridad = (status: string) => ESTADOS_CON_PRIORIDAD_EDITABLE.includes(status);

export const nombrePrioridad = (prioridad: PrioridadPedido) => (prioridad === "urgent" ? "urgente" : "normal");

/** Mensaje para el coordinador cuando el back rechaza el cambio de prioridad. */
export function mensajeErrorPrioridad(error: ApiError, orderNumber: string): string {
  if (error.code === "DISPATCH_PRIORITY_NOT_CHANGEABLE") {
    return `No se pudo cambiar la prioridad de ${orderNumber}: ya no está pendiente ni en planificación. Actualizamos la bandeja.`;
  }
  if (error.kind === "not-found") return `El pedido ${orderNumber} ya no existe. Actualizamos la bandeja.`;
  if (error.kind === "forbidden") return "No tienes permisos para cambiar la prioridad de los pedidos.";
  return `No se pudo cambiar la prioridad de ${orderNumber}. ${error.message}`;
}
