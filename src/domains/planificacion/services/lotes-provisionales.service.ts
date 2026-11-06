import api from "@/shared/lib/axios";
import type {
  AprobacionPromesas,
  AprobarPromesasPayload,
  AprobarLoteFinalPayload,
  AprobacionFinalLote,
  CorregirLotePayload,
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

/** Confirma de forma atómica el lote, los despachos y sus recursos asignados. */
export async function aprobarLoteFinal(id: number, payload: AprobarLoteFinalPayload): Promise<AprobacionFinalLote> {
  const { data } = await api.post<AprobacionFinalLote>(`/route-batches/${id}/approve-final`, payload, { skipErrorToast: true });
  return data;
}

/** Cambia conductor o vehículo propuestos; el backend vuelve a validar el lote. */
export async function corregirLoteFinal(id: number, payload: CorregirLotePayload): Promise<unknown> {
  const { version, driverId, vehicleId } = payload;
  const campo = driverId === undefined ? "vehicle" : "driver";
  const asignado = driverId ?? vehicleId;
  const { data } = await api.patch(`/route-batches/${id}/${campo}`, { version, [campo === "driver" ? "driverId" : "vehicleId"]: asignado }, { skipErrorToast: true });
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
