import api from "@/shared/lib/axios";
import type {
  AprobacionPromesas,
  AprobarPromesasPayload,
  AsignacionVehiculoLote,
  AsignarVehiculoPayload,
  ReasignarRevisorPayload,
  RevisorLote,
} from "../planificacion.types";

/*
 * Acciones sobre un lote provisional (ST-215.2, 1.ª aprobación).
 * Los errores los traduce el hook con mensajes propios del lote, por eso se omite el toast genérico.
 */

/**
 * Aprueba las promesas del lote: los pedidos pasan a `scheduled` y salen los correos.
 * Si el lote o un pedido cambió mientras se revisaba, el back responde 409.
 */
export async function aprobarPromesasLote(id: number, payload: AprobarPromesasPayload): Promise<AprobacionPromesas> {
  const { data } = await api.post<AprobacionPromesas>(`/route-batches/${id}/approve-promises`, payload, { skipErrorToast: true });
  return data;
}

/**
 * Cambia el vehículo del lote con la versión que se revisó: 409 ROUTE_BATCH_VERSION_CONFLICT si cambió,
 * 409 ROUTE_CAPACITY_EXCEEDED si la carga no entra.
 */
export async function asignarVehiculoLote(id: number, payload: AsignarVehiculoPayload): Promise<AsignacionVehiculoLote> {
  const { data } = await api.patch<AsignacionVehiculoLote>(`/route-batches/${id}/vehicle`, payload, { skipErrorToast: true });
  return data;
}

/** Entrega el lote completo a otro coordinador o supervisor activo. */
export async function reasignarRevisorLote(id: number, payload: ReasignarRevisorPayload): Promise<RevisorLote> {
  const { data } = await api.patch<RevisorLote>(`/route-batches/${id}/reviewer`, payload, { skipErrorToast: true });
  return data;
}
