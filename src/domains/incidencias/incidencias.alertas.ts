import type { ApiError } from "@/shared/lib/api-error";
import type { AlertaLevantada, AlertaOperativa, EstadoAlerta, FiltrosAlertas, ParamsAlertas, TipoAlerta } from "./incidencias.types";

/** Evento del socket que avisa una alerta nueva (ST-66.2). */
export const EVENTO_ALERTA_LEVANTADA = "operational.alert_raised";

/** El back no deja pedir más de 100 por página. */
export const LIMITE_ALERTAS = 100;

export const TIPOS_ALERTA: readonly { valor: TipoAlerta; etiqueta: string }[] = [
  { valor: "critical_incident", etiqueta: "Incidencia crítica" },
  { valor: "gps_stale", etiqueta: "Vehículo sin señal" },
  { valor: "driver_incidents", etiqueta: "Repartidor con muchas incidencias" },
  { valor: "sla_below_threshold", etiqueta: "Cumplimiento bajo el umbral" },
];

export const ESTADOS_ALERTA: readonly { valor: EstadoAlerta; etiqueta: string }[] = [
  { valor: "open", etiqueta: "Abierta" },
  { valor: "acknowledged", etiqueta: "Atendida" },
];

export const etiquetaTipoAlerta = (tipo: TipoAlerta) => TIPOS_ALERTA.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
export const etiquetaEstadoAlerta = (estado: EstadoAlerta) => ESTADOS_ALERTA.find((e) => e.valor === estado)?.etiqueta ?? estado;

const esTipo = (valor: string | null): valor is TipoAlerta => TIPOS_ALERTA.some((t) => t.valor === valor);
const esEstado = (valor: string | null): valor is EstadoAlerta => ESTADOS_ALERTA.some((e) => e.valor === valor);

/** Por defecto se ven las abiertas de todos los tipos: es lo que hay que atender. */
export const FILTROS_ALERTAS_POR_DEFECTO: FiltrosAlertas = { tipo: "todos", estado: "open" };

/** Lee `tipo` y `estado` de la URL; lo que falte o no sea válido toma el valor por defecto. */
export function leerFiltrosAlertas(params: URLSearchParams): FiltrosAlertas {
  const tipo = params.get("tipo");
  const estado = params.get("estado");
  return {
    tipo: esTipo(tipo) ? tipo : FILTROS_ALERTAS_POR_DEFECTO.tipo,
    estado: estado === "todas" || esEstado(estado) ? estado : FILTROS_ALERTAS_POR_DEFECTO.estado,
  };
}

/** Escribe los filtros en la URL sin tocar otros parámetros; los valores por defecto no se escriben. */
export function escribirFiltrosAlertas(filtros: FiltrosAlertas, actuales: URLSearchParams): URLSearchParams {
  const siguiente = new URLSearchParams(actuales);
  if (filtros.tipo === FILTROS_ALERTAS_POR_DEFECTO.tipo) siguiente.delete("tipo");
  else siguiente.set("tipo", filtros.tipo);
  if (filtros.estado === FILTROS_ALERTAS_POR_DEFECTO.estado) siguiente.delete("estado");
  else siguiente.set("estado", filtros.estado);
  return siguiente;
}

/** El estado va al back; el tipo se filtra aquí porque `GET /alerts` no lo acepta. */
export function paramsAlertas(filtros: FiltrosAlertas, page = 1): ParamsAlertas {
  return filtros.estado === "todas" ? { page, limit: LIMITE_ALERTAS } : { status: filtros.estado, page, limit: LIMITE_ALERTAS };
}

export function filtrarPorTipo(alertas: readonly AlertaOperativa[], tipo: FiltrosAlertas["tipo"]): AlertaOperativa[] {
  return tipo === "todos" ? [...alertas] : alertas.filter((a) => a.kind === tipo);
}

/** Más nuevas primero; si llegan en el mismo instante, la de id mayor. */
export const ordenarAlertas = (alertas: readonly AlertaOperativa[]) =>
  [...alertas].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id);

/** Lo que muestra la campana: nada sin alertas, y "99+" para no romper el globo. */
export function textoContador(total: number): string | null {
  if (total <= 0) return null;
  return total > 99 ? "99+" : String(total);
}

const numero = (detalle: Record<string, unknown>, clave: string) =>
  typeof detalle[clave] === "number" ? (detalle[clave] as number) : null;
const texto = (detalle: Record<string, unknown>, clave: string) =>
  typeof detalle[clave] === "string" && detalle[clave] !== "" ? (detalle[clave] as string) : null;

const formatoHora = new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", hour: "2-digit", minute: "2-digit" });
export const horaBolivia = (iso: string) => formatoHora.format(new Date(iso));

/** Una línea legible con el contexto de `detail`, según el tipo. */
export function descripcionAlerta(alerta: Pick<AlertaLevantada, "kind" | "dispatchId" | "driverId" | "detail">): string {
  const { detail } = alerta;
  switch (alerta.kind) {
    case "critical_incident": {
      const motivo = texto(detail, "reasonCode");
      const despacho = alerta.dispatchId === null ? "Un despacho" : `El despacho #${alerta.dispatchId}`;
      return motivo ? `${despacho} reportó una incidencia crítica (${motivo}).` : `${despacho} reportó una incidencia crítica.`;
    }
    case "gps_stale": {
      const ultima = texto(detail, "lastLocationAt");
      const minutos = numero(detail, "thresholdMinutes");
      const desde = ultima ? `desde las ${horaBolivia(ultima)}` : "sin ninguna posición registrada";
      return minutos === null ? `Vehículo sin señal ${desde}.` : `Vehículo sin señal ${desde} (umbral: ${minutos} min).`;
    }
    case "driver_incidents": {
      const cantidad = numero(detail, "incidentCount");
      const umbral = numero(detail, "threshold");
      if (cantidad === null) return "Repartidor con demasiadas incidencias hoy.";
      return umbral === null ? `Repartidor con ${cantidad} incidencias hoy.` : `Repartidor con ${cantidad} incidencias hoy (máximo: ${umbral}).`;
    }
    case "sla_below_threshold": {
      const porcentaje = numero(detail, "onTimePercentage");
      const umbral = numero(detail, "threshold");
      if (porcentaje === null) return "El cumplimiento de la zona está bajo el umbral.";
      return umbral === null ? `Zona con ${porcentaje}% de entregas a tiempo hoy.` : `Zona con ${porcentaje}% de entregas a tiempo hoy (mínimo: ${umbral}%).`;
    }
  }
}

export interface EnlaceAlerta {
  href: string;
  etiqueta: string;
}

/**
 * A dónde ir desde la alerta: la ficha del despacho si hay uno; si no, el vehículo en el mapa.
 * El mapa todavía no lee `vehiculoId` (falta confirmar con el dueño del mapa); mientras tanto abre sin selección.
 */
export function enlaceAlerta(alerta: Pick<AlertaOperativa, "dispatchId" | "vehicleId">): EnlaceAlerta | null {
  if (alerta.dispatchId !== null) return { href: `/app/despachos/${alerta.dispatchId}`, etiqueta: "Ver despacho" };
  if (alerta.vehicleId !== null) return { href: `/app/mapa?vehiculoId=${alerta.vehicleId}`, etiqueta: "Ver en el mapa" };
  return null;
}

const esIdONulo = (valor: unknown) => valor === null || Number.isInteger(valor);

/** Lo que llega por el socket viene sin tipo: solo se usa si tiene la forma de una alerta. */
export function esAlertaLevantada(payload: unknown): payload is AlertaLevantada {
  if (!payload || typeof payload !== "object") return false;
  const evento = payload as Partial<Record<keyof AlertaLevantada, unknown>>;
  return Number.isInteger(evento.id)
    && esTipo(typeof evento.kind === "string" ? evento.kind : null)
    && (evento.severity === "critical" || evento.severity === "warning")
    && esIdONulo(evento.zoneId) && esIdONulo(evento.dispatchId) && esIdONulo(evento.driverId)
    && typeof evento.detail === "object" && evento.detail !== null;
}

export function mensajeErrorAtender(error: ApiError): string {
  if (error.code === "OPERATIONAL_ALERT_ALREADY_ACKNOWLEDGED") return "Otra persona ya marcó esta alerta como atendida.";
  if (error.code === "OPERATIONAL_ALERT_NOT_FOUND") return "La alerta ya no existe.";
  if (error.kind === "forbidden") return "Solo el coordinador o el supervisor pueden atender alertas.";
  return error.message;
}
