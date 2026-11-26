import api from "@/shared/lib/axios";
import type { ParamsCalidad, ReporteCalidad } from "../reportes.calidad";

/** Dashboard 4 (ST-300.2): coordinador, supervisor o root. Sin caché en el back; la calificación global solo para supervisor. */
export async function obtenerReporteCalidad(params: ParamsCalidad, signal?: AbortSignal): Promise<ReporteCalidad> {
  const { data } = await api.get<ReporteCalidad>("/reports/quality", { params, signal, skipErrorToast: true });
  return data;
}
