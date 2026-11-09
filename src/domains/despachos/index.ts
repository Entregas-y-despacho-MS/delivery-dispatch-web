export { useBandejaPedidos } from "./hooks/use-bandeja-pedidos";
export { useHistorial } from "./hooks/use-historial";
export { ReprogramarDialog } from "./components/reprogramar-dialog";
export { historialService } from "./services/historial.service";
export type { HistorialDespacho, HistorialParams, HistorialResponse, EstadoFinalDespacho } from "./historial.types";
export { useCambiarPrioridad } from "./hooks/use-cambiar-prioridad";
export { useDispatchEvents } from "./hooks/use-dispatch-events";
export { useTableroKanban } from "./hooks/use-tablero-kanban";
export { useTableroKanbanFiltros } from "./hooks/use-tablero-kanban-filtros";
export { TableroKanban } from "./components/tablero-kanban";
export { COLUMNAS_INVERSA, COLUMNAS_OPERATIVAS, destinoAbreRevision, ordenarColumnas, puedeArrastrarDespacho } from "./tablero-kanban.rules";
export type { OrdenActual, PrioridadFilter, TurnoFilter, ZonaFilter } from "./hooks/use-bandeja-pedidos";
export { BandejaPedidosToolbar } from "./components/bandeja-pedidos-toolbar";
export type { ZonaOpcion } from "./components/bandeja-pedidos-toolbar";
export { BandejaPedidosVista } from "./components/bandeja-pedidos-vista";
export { PedidoBadges, PrioridadBadge } from "./components/pedido-badges";
export { PrioridadSelector } from "./components/prioridad-selector";
export { formatearFranja, formatearKilos, formatearMetrosCubicos } from "./despachos.format";
export { useHistorialDespachos } from "./hooks/use-historial-despachos";
export { HistorialDespachosToolbar } from "./components/historial-despachos-toolbar";
export type { ConductorOpcion } from "./components/historial-despachos-toolbar";
export { HistorialDespachosTabla } from "./components/historial-despachos-tabla";
export { HistorialDespachosVista } from "./components/historial-despachos-vista";
export { exportarHistorialCsv, historialDespachosService, nombreArchivoCsv } from "./services/historial-despachos.service";
export { escribirFiltrosHistorial, FILTROS_HISTORIAL_INICIALES, leerFiltrosHistorial, paramsHistorial, rangoInvertido } from "./historial.url";
export type { FiltrosHistorial } from "./historial.url";
export { ESTADOS_FINALES, ORDENES_HISTORIAL } from "./historial.types";
export type { DespachoHistorial, EstadoFinal, OrdenHistorial } from "./historial.types";
export { solicitudesCambioKeys, useEnlaceSeguimiento, useSolicitudesCambio } from "./hooks/use-solicitudes-cambio";
export { SolicitudesCambioToolbar } from "./components/solicitudes-cambio-toolbar";
export { SolicitudesCambioLista } from "./components/solicitudes-cambio-lista";
export { SolicitudesCambioVista } from "./components/solicitudes-cambio-vista";
export { ResolverSolicitudDialog } from "./components/resolver-solicitud-dialog";
export { EnlaceSeguimientoDialog } from "./components/enlace-seguimiento-dialog";
export { revelarEnlaceSeguimiento, solicitudesCambioService } from "./services/solicitudes-cambio.service";
export { errorEnlace } from "./solicitudes-cambio.reglas";
export { escribirFiltrosSolicitudes, leerFiltrosSolicitudes, paramsSolicitudes } from "./solicitudes-cambio.url";
export type { FiltrosSolicitudes } from "./solicitudes-cambio.url";
export type { EnlaceSeguimiento, PedidoDeCambio, SolicitudCambio, SolicitudesCambioParams, SolicitudesCambioResponse } from "./solicitudes-cambio.types";
export { excluidosCotejoKeys, useCancelarDespacho, useExcluidosCotejo, useResolverCotejo } from "./hooks/use-excluidos-cotejo";
export { ExcluidosCotejoPanel } from "./components/excluidos-cotejo-panel";
export { CancelarDespachoDialog } from "./components/cancelar-despacho-dialog";
export { MarcarResueltoDialog } from "./components/marcar-resuelto-dialog";
export { cancelarDespacho, marcarCotejoResuelto, obtenerExcluidosCotejo } from "./services/excluidos-cotejo.service";
export { codigoParada, etiquetaMotivoFalla, mensajeErrorAccionCotejo, motivoNoCancelable, puedeCancelar } from "./excluidos-cotejo.reglas";
export type { CotejoResuelto, DespachoCancelado, ExcluidoCotejo, FallaCotejo, MotivoFallaCotejo } from "./excluidos-cotejo.types";
export { DespachoFicha } from "./components/despacho-ficha";
export type { PestanaFicha } from "./components/despacho-ficha";
export { EvidenciaVisor } from "./components/evidencia-visor";
export { FichaEvidencias } from "./components/ficha-evidencias";
export { FichaGeneral } from "./components/ficha-general";
export { FichaIncidencias } from "./components/ficha-incidencias";
export { FichaLineaTiempo } from "./components/ficha-linea-tiempo";
export { despachoDetalleKeys, useDespachoDetalle } from "./hooks/use-despacho-detalle";
export { useReprogramacionDespacho } from "./hooks/use-reprogramacion-despacho";
export { ReprogramarDespachoDialog } from "./components/reprogramar-despacho-dialog";
export type { MotivoOpcion } from "./components/reprogramar-despacho-dialog";
export {
  contarIntentos,
  estadoIntentos,
  generarFranjas,
  hoyEnBolivia,
  mensajeErrorReprogramacion,
  puedeDevolver,
  puedeReprogramar,
  requiereRecargar,
  ventanaUtc,
} from "./reprogramacion.reglas";
export type { EstadoIntentos, Franja } from "./reprogramacion.reglas";
export { devolverAlAlmacen, reprogramarDespacho } from "./services/reprogramacion.service";
export type { DevolucionHecha, ReprogramacionHecha, ReprogramarPayload } from "./services/reprogramacion.service";
export { obtenerDetalleDespacho } from "./services/despacho-detalle.service";
export {
  enlaceMapa,
  etiquetaEstadoDespacho,
  etiquetaEvento,
  etiquetaEvidencia,
  formatearCoordenadas,
  formatearFechaHoraExacta,
  formatearVentana,
  formatearVentanaConDia,
  quienOrigino,
  urlVencida,
} from "./despacho-detalle.format";
export type {
  DespachoDetalle,
  EventoDetalle,
  EvidenciaDetalle,
  IncidenciaDetalle,
  ReprogramacionDetalle,
  TipoEvidencia,
} from "./despacho-detalle.types";

export type {
  PedidoPendiente,
  PedidosPendientesParams,
  PrioridadPedido,
  ReservaPedido,
  SituacionBandeja,
  ColumnaKanban,
  ColumnaKanbanKey,
  DespachoKanban,
  FiltrosTableroKanban,
} from "./despachos.types";

// Órdenes de recojo de devolución (ST-81.1).
export { recojosService } from "./services/recojos.service";
export { almacenesKeys, recojosKeys, useAccionesRecojo, useAlmacenes, useRecojos } from "./hooks/use-recojos";
export { RecojosFiltros } from "./components/recojos-filtros";
export { RecojosTable } from "./components/recojos-table";
export { NuevoRecojoDialog } from "./components/nuevo-recojo-dialog";
export { AnularRecojoDialog } from "./components/anular-recojo-dialog";
export { aCrearRecojoInput, crearRecojoSchema, RECOJO_FORM_VACIO, type RecojoFormValues } from "./recojos.schemas";
export {
  ESTADOS_RECOJO,
  ETIQUETA_ORIGEN,
  MAX_MOTIVO_ANULACION,
  RECOJOS_POR_PAGINA,
  errorRecojo,
  escribirFiltrosRecojos,
  hayFiltrosRecojos,
  leerFiltrosRecojos,
  paramsRecojos,
  rangoRecojosInvertido,
  sePuedeAnular,
  type CampoRecojo,
  type ErrorRecojo,
  type FiltrosRecojos,
} from "./recojos.reglas";
// Recepción en almacén de recojos y recogidas (ST-240.5).
export type { ItemRecepcion, RecepcionAlmacen, ResultadoRecepcion } from "./recepcion.types";
export {
  RESULTADOS_RECEPCION,
  esResultadoRecepcion,
  etiquetaResultadoRecepcion,
  formatearCantidad,
  itemConDiferencia,
  nombreItemRecepcion,
  tonoResultadoRecepcion,
  totalesRecepcion,
  type TonoRecepcion,
  type TotalesRecepcion,
} from "./recepcion.reglas";
export { FichaRecepcion } from "./components/ficha-recepcion";
export { ResultadoRecepcionBadge } from "./components/resultado-recepcion-badge";
export type {
  Almacen,
  AlmacenDestino,
  CrearRecojoInput,
  OrigenRecojo,
  Recojo,
  RecojoListParams,
  RecojosResponse,
} from "./recojos.types";
