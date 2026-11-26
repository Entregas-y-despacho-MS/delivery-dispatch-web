import type { ApiError } from "@/shared/lib/api-error";
import { leerFiltrosSla, problemaRango, type ProblemaRango } from "./reportes.reglas";

/*
 * Dashboard 4 de calidad y reclamos (ST-300.3) sobre GET /reports/quality (ST-300.1/300.2). Cada indicador trae
 * fórmula, numerador, denominador y n. N/D (`available: false`) lleva su causa; «Sin datos» (`value: null`) es un
 * período sin nada que medir. Nunca se muestra un cero inventado.
 */

export type UnidadKpi = "percent" | "minutes" | "score";

export interface KpiCalidad {
  code: string;
  formula: string;
  unit: UnidadKpi;
  numerator: number | null;
  denominator: number | null;
  n: number;
  value: number | null;
  available: boolean;
  reason: string | null;
  dateBasis: string;
}

export interface CasoCalidad {
  caseId: number;
  dispatchId: number;
  reasonCode: string;
  investigationStatus: string;
  openedAt: string;
  investigationStartedAt: string | null;
  decidedAt: string | null;
  open: boolean;
  ageMinutes: number | null;
}

export interface DespachoCalidad {
  dispatchId: number;
  status: string;
  attemptCount: number;
  attemptsWithIncidentCount: number;
  incidentEventCount: number;
  rescheduled: boolean;
  reconstructable: boolean;
}

interface Pagina<T> {
  data: T[];
  meta: { page: number; limit: number; pages: number; total: number };
}

export interface ReporteCalidad {
  period: { from: string; to: string; timeZone: string };
  filters: { zoneId: number | null; status: string | null; incidentReasonId: number | null; reasonCode: string | null; rescheduled: boolean | null };
  kpis: Record<"incidentRate" | "rescheduleRate" | "complaintRate" | "investigationTime" | "ratingAverage" | "responseRate", KpiCalidad>;
  details: {
    attempts: { attemptCount: number; attemptsWithIncidentCount: number; dispatchesWithIncidentCount: number; incidentEventCount: number; incidentsWithoutAttemptCount: number; notReconstructableCount: number };
    reschedules: { rescheduledDispatchCount: number; rescheduleEventCount: number; reassignmentOnlyCount: number; eligibleDispatchCount: number };
    complaints: { caseCount: number; dispatchesWithCaseCount: number; deliveredDispatchCount: number; decidedWithoutTimestampsCount: number; open: { count: number; oldestAgeMinutes: number | null } };
    attemptCoverage: { from: string | null; complete: boolean };
  };
  tables: { cases: Pagina<CasoCalidad>; dispatches: Pagina<DespachoCalidad> };
  sources: string[];
}

export type ParamsCalidad = {
  from: string;
  to: string;
  page: number;
  limit: number;
  order: "asc" | "desc";
  zoneId?: number;
  status?: string;
  incidentReasonId?: number;
  reasonCode?: string;
  rescheduled?: boolean;
};

export const CALIDAD_POR_PAGINA = 10;
export const ND = "N/D";
export const SIN_DATOS = "Sin datos";

export const KPIS_CALIDAD: { clave: keyof ReporteCalidad["kpis"]; titulo: string; formula: string }[] = [
  { clave: "incidentRate", titulo: "Incidencias por 100 intentos", formula: "Intentos con al menos una incidencia / intentos válidos × 100" },
  { clave: "rescheduleRate", titulo: "Reprogramación", formula: "Despachos reprogramados / despachos elegibles × 100" },
  { clave: "complaintRate", titulo: "Reclamos", formula: "Casos CRM válidos / despachos entregados × 100" },
  { clave: "investigationTime", titulo: "Mediana de investigación", formula: "Mediana de minutos entre apertura y dictamen (casos cerrados)" },
  { clave: "ratingAverage", titulo: "Calificación promedio", formula: "Suma de calificaciones / calificaciones recibidas" },
  { clave: "responseRate", titulo: "Tasa de respuesta", formula: "Calificaciones recibidas / entregas con invitación a calificar × 100" },
];

export const CAUSAS_ND: Record<string, string> = {
  attempt_coverage_incomplete: "Hay intentos anteriores al registro de intentos: el período no se puede reconstruir completo.",
  investigation_timestamp_missing: "Hay casos decididos sin fecha de inicio o de dictamen.",
  rating_not_authorized: "La calificación global la ve solo el Supervisor de Flota.",
  response_opportunity_not_recorded: "Todavía no se registra la invitación a calificar.",
};

export const BASES_FECHA: Record<string, string> = {
  promise_window_end: "fin de la franja prometida",
  closed_at: "cierre de la entrega",
};

export const causaNd = (causa: string | null) => (causa ? CAUSAS_ND[causa] ?? causa : "Sin causa informada.");

const decimal = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 });
const dosDecimales = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });

/** «12,5 %», «45 min», «4,25 / 5»; N/D o «Sin datos» según el back. */
export function valorKpi(kpi: KpiCalidad): string {
  if (!kpi.available) return ND;
  if (kpi.value === null) return SIN_DATOS;
  if (kpi.unit === "percent") return `${decimal.format(kpi.value)} %`;
  if (kpi.unit === "minutes") return formatearMinutos(kpi.value);
  return `${dosDecimales.format(kpi.value)} / 5`;
}

/** «num / den · n = X»; sin numerador (mediana), solo n. */
export function detalleKpi(kpi: KpiCalidad): string {
  const fraccion = kpi.numerator !== null && kpi.denominator !== null ? `${decimal.format(kpi.numerator)} / ${decimal.format(kpi.denominator)} · ` : "";
  return `${fraccion}n = ${kpi.n}`;
}

/** 45 → «45 min»; 135 → «2 h 15 min»; 3000 → «2 d 2 h». */
export function formatearMinutos(minutos: number): string {
  const total = Math.max(0, Math.round(minutos));
  if (total < 60) return `${total} min`;
  if (total < 1440) {
    const resto = total % 60;
    return resto ? `${Math.floor(total / 60)} h ${resto} min` : `${Math.floor(total / 60)} h`;
  }
  const horas = Math.floor((total % 1440) / 60);
  return horas ? `${Math.floor(total / 1440)} d ${horas} h` : `${Math.floor(total / 1440)} d`;
}

/**
 * Casos por motivo. Solo se calcula si la tabla trae todos los casos de la cohorte; si no, es N/D (null):
 * una página no representa la distribución.
 */
export function distribucionPorMotivo(casos: Pagina<CasoCalidad>): { motivo: string; cantidad: number }[] | null {
  if (casos.meta.total > casos.data.length) return null;
  const conteo = new Map<string, number>();
  for (const caso of casos.data) conteo.set(caso.reasonCode, (conteo.get(caso.reasonCode) ?? 0) + 1);
  return [...conteo.entries()].map(([motivo, cantidad]) => ({ motivo, cantidad })).sort((a, b) => b.cantidad - a.cantidad || a.motivo.localeCompare(b.motivo));
}

export const ESTADOS_DESPACHO_CALIDAD: Record<string, string> = {
  delivered: "Entregado",
  not_delivered: "No entregado",
  incident: "Con incidencia",
  returned: "Devuelto",
  rescheduled: "Reprogramado",
};

/* ── Filtros en la URL. El período es el mismo `desde`/`hasta` de los otros reportes. ── */

export interface FiltrosCalidad {
  desde: string;
  hasta: string;
  zona: number | null;
  estado: string | null;
  motivoIncidencia: number | null;
  motivoReclamo: string;
  reprogramado: boolean | null;
  pagina: number;
  orden: "asc" | "desc";
}

const entero = (valor: string | null) => (valor && /^\d+$/.test(valor) && Number(valor) > 0 ? Number(valor) : null);

export function leerFiltrosCalidad(url: URLSearchParams, ahora = new Date()): FiltrosCalidad {
  const { desde, hasta } = leerFiltrosSla(url, ahora);
  const estado = url.get("estadoDespacho");
  const reprogramado = url.get("reprogramado");
  return {
    desde,
    hasta,
    zona: entero(url.get("zona")),
    estado: estado && estado in ESTADOS_DESPACHO_CALIDAD ? estado : null,
    motivoIncidencia: entero(url.get("motivoIncidencia")),
    motivoReclamo: (url.get("motivoReclamo") ?? "").slice(0, 64),
    reprogramado: reprogramado === "si" ? true : reprogramado === "no" ? false : null,
    pagina: entero(url.get("paginaCalidad")) ?? 1,
    orden: url.get("ordenCalidad") === "asc" ? "asc" : "desc",
  };
}

/** Escribe solo los filtros propios de Calidad; `desde`/`hasta` los maneja el filtro de período compartido. */
export function escribirFiltrosCalidad(f: FiltrosCalidad, base: URLSearchParams): URLSearchParams {
  const url = new URLSearchParams(base);
  const poner = (clave: string, valor: string | number | null) => {
    if (valor === null || valor === "") url.delete(clave);
    else url.set(clave, String(valor));
  };
  poner("zona", f.zona);
  poner("estadoDespacho", f.estado);
  poner("motivoIncidencia", f.motivoIncidencia);
  poner("motivoReclamo", f.motivoReclamo.trim());
  poner("reprogramado", f.reprogramado === null ? null : f.reprogramado ? "si" : "no");
  poner("paginaCalidad", f.pagina > 1 ? f.pagina : null);
  poner("ordenCalidad", f.orden === "asc" ? "asc" : null);
  return url;
}

export const hayFiltrosCalidad = (f: FiltrosCalidad) =>
  Boolean(f.zona || f.estado || f.motivoIncidencia || f.motivoReclamo.trim() || f.reprogramado !== null);

export const problemaCalidad = (f: FiltrosCalidad): ProblemaRango | null => problemaRango(f);

export function paramsCalidad(f: FiltrosCalidad): ParamsCalidad {
  const params: ParamsCalidad = { from: f.desde, to: f.hasta, page: f.pagina, limit: CALIDAD_POR_PAGINA, order: f.orden };
  if (f.zona) params.zoneId = f.zona;
  if (f.estado) params.status = f.estado;
  if (f.motivoIncidencia) params.incidentReasonId = f.motivoIncidencia;
  if (f.motivoReclamo.trim()) params.reasonCode = f.motivoReclamo.trim();
  if (f.reprogramado !== null) params.rescheduled = f.reprogramado;
  return params;
}

export function mensajeErrorCalidad(error: ApiError): string {
  if (error.code === "INVALID_DATE_RANGE") return "La fecha «Desde» no puede ser posterior a «Hasta».";
  if (error.code === "DATE_RANGE_TOO_LARGE") return "El período no puede pasar de 366 días.";
  if (error.status === 403) return "No tienes permiso para ver el tablero de calidad.";
  if (error.kind === "network") return "No pudimos conectarnos con el servidor. Revisa tu conexión.";
  return "No pudimos cargar el tablero de calidad. Intenta de nuevo.";
}
