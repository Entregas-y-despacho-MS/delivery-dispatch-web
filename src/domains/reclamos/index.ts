export {
  CODIGOS_DICTAMEN,
  DICTAMENES,
  ESTADOS_RECLAMO,
  MENSAJE_PROBLEMA_RECLAMOS,
  antiguedad,
  estadoVisible,
  etiquetaDictamen,
  etiquetaEstadoReclamo,
  etiquetaSiguienteAccion,
  hayFiltrosReclamos,
  mensajeErrorReclamos,
  validarDictamen,
  type BorradorDictamen,
  type FiltrosReclamos,
} from "./reclamos.reglas";
export type { Dictamen, EstadoReclamo, Reclamo, ReclamoDetalle, SiguienteAccion } from "./types/reclamos.types";
export { useReclamos } from "./hooks/use-reclamos";
export { ReclamosFiltros, type ZonaOpcion } from "./components/reclamos-filtros";
export { ReclamosTabla } from "./components/reclamos-tabla";
export { ReclamoDetalle as ReclamoDetalleSheet } from "./components/reclamo-detalle";
