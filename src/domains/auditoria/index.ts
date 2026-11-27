export {
  ACCIONES_AUDITORIA,
  AUDITORIA_POR_PAGINA,
  CODIGOS_ACCION,
  DIAS_AUDITORIA_POR_DEFECTO,
  ENTIDADES_AUDITORIA,
  MAX_DIAS_AUDITORIA,
  MENSAJE_PROBLEMA_AUDITORIA,
  RESULTADOS_AUDITORIA,
  ROLES_AUDITORIA,
  diasDelRango,
  escribirFiltrosAuditoria,
  etiquetaAccion,
  etiquetaEntidad,
  etiquetaRol,
  filtrosAuditoriaPorDefecto,
  formatearHoraAuditoria,
  hayFiltrosAuditoria,
  hoyBolivia,
  leerFiltrosAuditoria,
  mensajeErrorAuditoria,
  paramsAuditoria,
  problemaFiltrosAuditoria,
  type AccionAuditoria,
  type FiltrosAuditoria,
  type ProblemaFiltrosAuditoria,
} from "./auditoria.reglas";
export { buscarEventosAuditoria } from "./services/auditoria.service";
export { auditoriaKeys, useAuditoria } from "./hooks/use-auditoria";
export { AuditoriaFiltros } from "./components/auditoria-filtros";
export { AuditoriaTabla, ResultadoAuditoriaBadge } from "./components/auditoria-tabla";
export { AuditoriaDetalle } from "./components/auditoria-detalle";
export type {
  AuditoriaParams,
  AuditoriaResponse,
  EventoAuditoria,
  OrdenAuditoria,
  ResultadoAuditoria,
} from "./types/auditoria.types";
