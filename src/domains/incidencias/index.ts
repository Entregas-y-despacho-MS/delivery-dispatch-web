export type {
  AlertaLevantada,
  AlertaOperativa,
  EstadoAlerta,
  FiltrosAlertas,
  ParamsAlertas,
  RespuestaAlertas,
  SeveridadAlerta,
  TipoAlerta,
} from "./incidencias.types";
export {
  ESTADOS_ALERTA,
  EVENTO_ALERTA_LEVANTADA,
  FILTROS_ALERTAS_POR_DEFECTO,
  LIMITE_ALERTAS,
  TIPOS_ALERTA,
  descripcionAlerta,
  enlaceAlerta,
  escribirFiltrosAlertas,
  etiquetaEstadoAlerta,
  etiquetaTipoAlerta,
  filtrarPorTipo,
  horaBolivia,
  leerFiltrosAlertas,
  mensajeErrorAtender,
  ordenarAlertas,
  paramsAlertas,
  textoContador,
  type EnlaceAlerta,
} from "./incidencias.alertas";
export { atenderAlerta, listarAlertas } from "./services/alertas.service";
export { alertasKeys, useAlertas, useAtenderAlerta, useContadorAlertas } from "./hooks/use-alertas-criticas";
