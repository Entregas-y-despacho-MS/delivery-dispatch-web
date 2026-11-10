import api from "@/shared/lib/axios";
import type { CotejoResuelto, DespachoCancelado, ExcluidoCotejo, ExcluidosCotejoResponse } from "../types/excluidos-cotejo.types";

/** Paradas fuera de la ruta por falla de cotejo (ST-241.3). Coordinador y supervisor. */
export async function obtenerExcluidosCotejo(signal?: AbortSignal): Promise<ExcluidoCotejo[]> {
  const { data } = await api.get<ExcluidosCotejoResponse>("/route-batches/cotejo-exclusions", { signal, skipErrorToast: true });
  return data.data;
}

/** «El bulto apareció»: la parada sale de la lista y sigue assigned. Solo coordinador. */
export async function marcarCotejoResuelto(dispatchId: number, nota: string | null): Promise<CotejoResuelto> {
  const { data } = await api.post<CotejoResuelto>(
    `/dispatches/${dispatchId}/cotejo-resolved`,
    nota ? { note: nota } : {},
    { skipErrorToast: true },
  );
  return data;
}

/** Cancela un despacho antes de que salga la ruta, con causal obligatoria (ST-241.1). Solo coordinador. */
export async function cancelarDespacho(dispatchId: number, causal: string): Promise<DespachoCancelado> {
  const { data } = await api.post<DespachoCancelado>(`/dispatches/${dispatchId}/cancel`, { reason: causal }, { skipErrorToast: true });
  return data;
}
