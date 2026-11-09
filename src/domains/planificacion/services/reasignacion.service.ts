import api from "@/shared/lib/axios";
import type { DestinoReasignacion, ReasignarParadasPayload } from "../reasignacion.types";

export async function listarDestinosReasignacion(routeBatchId: number, signal?: AbortSignal): Promise<DestinoReasignacion[]> {
  const { data } = await api.get<DestinoReasignacion[]>(`/route-batches/${routeBatchId}/reassignment-targets`, { signal, skipErrorToast: true });
  return data;
}

export async function reasignarParadas(routeBatchId: number, payload: ReasignarParadasPayload): Promise<unknown> {
  const { data } = await api.post(`/route-batches/${routeBatchId}/reassign`, payload, { skipErrorToast: true });
  return data;
}
