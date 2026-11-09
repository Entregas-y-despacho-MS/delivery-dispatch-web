import api from "@/shared/lib/axios";
import type { ParamsReporteFlota, ReporteFlota } from "../reportes.flota";

/** Reporte de flota por período (ST-65.1): supervisor y coordinador; el back lo guarda en caché 10 minutos. */
export async function obtenerReporteFlota(params: ParamsReporteFlota, signal?: AbortSignal): Promise<ReporteFlota> {
  const { data } = await api.get<ReporteFlota>("/fleet/reports", { params, signal, skipErrorToast: true });
  return data;
}
