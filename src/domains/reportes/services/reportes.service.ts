import api from "@/shared/lib/axios";
import type { ParamsReporteSla, ReporteSla } from "../reportes.types";

/** Reporte de cumplimiento SLA (ST-54.2). Solo coordinador; el back lo guarda en caché 10 minutos. */
export async function obtenerReporteSla(params: ParamsReporteSla, signal?: AbortSignal): Promise<ReporteSla> {
  const { data } = await api.get<ReporteSla>("/reports/sla", { params, signal, skipErrorToast: true });
  return data;
}
