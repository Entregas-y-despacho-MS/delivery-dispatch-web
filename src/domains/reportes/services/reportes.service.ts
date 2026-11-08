import api from "@/shared/lib/axios";
import type { IndicadoresFlota, ParamsReporteSla, PeriodoKpi, ReporteSla } from "../reportes.types";

/** Reporte de cumplimiento SLA (ST-54.2). Solo coordinador; el back lo guarda en caché 10 minutos. */
export async function obtenerReporteSla(params: ParamsReporteSla, signal?: AbortSignal): Promise<ReporteSla> {
  const { data } = await api.get<ReporteSla>("/reports/sla", { params, signal, skipErrorToast: true });
  return data;
}

/** KPIs de la flota (ST-61.1): coordinador y supervisor; el back los guarda en caché 10 minutos. */
export async function obtenerIndicadoresFlota(periodo: PeriodoKpi, signal?: AbortSignal): Promise<IndicadoresFlota> {
  const { data } = await api.get<IndicadoresFlota>("/fleet/kpis", { params: { period: periodo }, signal, skipErrorToast: true });
  return data;
}
