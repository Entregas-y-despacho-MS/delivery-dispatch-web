import api from "@/shared/lib/axios";
import type { AprobacionFinal, AprobarLoteFinalPayload, AsignarConductorPayload, CorreccionLote } from "../planificacion.types";

/**
 * 2.ª aprobación del lote definitivo (ST-51.2): confirma juntos lote, pedidos, vehículo y conductor.
 * El back vuelve a validar franjas, bultos, capacidad y recursos; si algo cambió responde 409.
 * Los errores los traduce el hook, por eso se omite el toast genérico.
 */
export async function aprobarLoteFinal(id: number, payload: AprobarLoteFinalPayload): Promise<AprobacionFinal> {
  const { data } = await api.post<AprobacionFinal>(`/route-batches/${id}/approve-final`, payload, { skipErrorToast: true });
  return data;
}

/**
 * Corrige el conductor propuesto del lote (ST-51.6) con la versión que se revisó. En la revisión final
 * el back vuelve a validar el lote; si falla, lo devuelve a provisional.
 */
export async function asignarConductorLote(id: number, payload: AsignarConductorPayload): Promise<CorreccionLote> {
  const { data } = await api.patch<CorreccionLote>(`/route-batches/${id}/driver`, payload, { skipErrorToast: true });
  return data;
}
