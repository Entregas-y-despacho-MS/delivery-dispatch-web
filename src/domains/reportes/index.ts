export type { AgrupacionSla, FilaSla, FiltrosSla, MetricasSla, ParamsReporteSla, ReporteSla } from "./reportes.types";
export {
  AGRUPACIONES_SLA,
  MAX_DIAS_RANGO_SLA,
  MENSAJE_RANGO,
  UMBRAL_SLA_PORCENTAJE,
  cumpleUmbral,
  diasDelRango,
  escribirFiltrosSla,
  etiquetaAgrupacion,
  filasPorDemora,
  filtrosSlaPorDefecto,
  formatoMinutos,
  formatoPorcentaje,
  hoyBolivia,
  leerFiltrosSla,
  mensajeErrorSla,
  nombreGrupo,
  paramsReporteSla,
  problemaRango,
  type ProblemaRango,
} from "./reportes.reglas";
export { obtenerReporteSla } from "./services/reportes.service";
export { reporteSlaKeys, useReporteSla } from "./hooks/use-reportes";
export { FiltroPeriodoSla } from "./components/filtro-periodo";
export { ReporteSlaVista } from "./components/reporte-sla-vista";
