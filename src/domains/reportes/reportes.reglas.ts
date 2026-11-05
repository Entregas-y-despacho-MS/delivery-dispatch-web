import type { ApiError } from "@/shared/lib/api-error";
import type { AgrupacionSla, FilaSla, FiltrosSla, ParamsReporteSla } from "./reportes.types";

export const AGRUPACIONES_SLA: readonly { valor: AgrupacionSla; etiqueta: string }[] = [
  { valor: "zone", etiqueta: "Zona" },
  { valor: "service_level", etiqueta: "Nivel de servicio" },
  { valor: "driver", etiqueta: "Repartidor" },
];

export const etiquetaAgrupacion = (agrupacion: AgrupacionSla) =>
  AGRUPACIONES_SLA.find((a) => a.valor === agrupacion)?.etiqueta ?? agrupacion;

/** El back rechaza rangos de más de 366 días (DATE_RANGE_TOO_LARGE). */
export const MAX_DIAS_RANGO_SLA = 366;

/**
 * % de entregas a tiempo pactado. Referencia fija hasta que el umbral sea un parámetro
 * del sistema (ES-67); cambiarlo aquí cambia la línea de los gráficos y la tabla.
 */
export const UMBRAL_SLA_PORCENTAJE = 90;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const formatoDiaBolivia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" });

/** Hoy en Bolivia, YYYY-MM-DD. */
export const hoyBolivia = (ahora = new Date()) => formatoDiaBolivia.format(ahora);

const esFecha = (valor: string | null): valor is string => valor !== null && FECHA.test(valor) && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`));
const esAgrupacion = (valor: string | null): valor is AgrupacionSla => AGRUPACIONES_SLA.some((a) => a.valor === valor);

/** Por defecto: del primer día del mes en curso hasta hoy, agrupado por zona. */
export function filtrosSlaPorDefecto(ahora = new Date()): FiltrosSla {
  const hoy = hoyBolivia(ahora);
  return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy, agrupacion: "zone" };
}

/** Lee `desde`, `hasta` y `agrupar` de la URL; lo que falte o no sea válido toma el valor por defecto. */
export function leerFiltrosSla(params: URLSearchParams, ahora = new Date()): FiltrosSla {
  const base = filtrosSlaPorDefecto(ahora);
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  const agrupar = params.get("agrupar");
  return {
    desde: desde === "" || esFecha(desde) ? desde : base.desde,
    hasta: hasta === "" || esFecha(hasta) ? hasta : base.hasta,
    agrupacion: esAgrupacion(agrupar) ? agrupar : base.agrupacion,
  };
}

/** Escribe los filtros en la URL sin tocar otros parámetros. */
export function escribirFiltrosSla(filtros: FiltrosSla, actuales: URLSearchParams): URLSearchParams {
  const siguiente = new URLSearchParams(actuales);
  siguiente.set("desde", filtros.desde);
  siguiente.set("hasta", filtros.hasta);
  siguiente.set("agrupar", filtros.agrupacion);
  return siguiente;
}

export const diasDelRango = (desde: string, hasta: string) =>
  Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000) + 1;

export type ProblemaRango = "incompleto" | "invertido" | "muy-largo";

/** El mismo control que hace el back, para no pedir un reporte que va a fallar. */
export function problemaRango({ desde, hasta }: Pick<FiltrosSla, "desde" | "hasta">): ProblemaRango | null {
  if (!esFecha(desde) || !esFecha(hasta)) return "incompleto";
  if (desde > hasta) return "invertido";
  if (diasDelRango(desde, hasta) > MAX_DIAS_RANGO_SLA) return "muy-largo";
  return null;
}

export const MENSAJE_RANGO: Record<ProblemaRango, string> = {
  incompleto: "Elige las dos fechas del período.",
  invertido: "La fecha «Desde» no puede ser posterior a «Hasta».",
  "muy-largo": `El período no puede pasar de ${MAX_DIAS_RANGO_SLA} días.`,
};

export const paramsReporteSla = ({ desde, hasta, agrupacion }: FiltrosSla): ParamsReporteSla =>
  ({ from: desde, to: hasta, groupBy: agrupacion });

const SIN_GRUPO: Record<AgrupacionSla, string> = {
  zone: "Sin zona",
  service_level: "Sin nivel de servicio",
  driver: "Sin repartidor",
};

/** El back manda `groupName: null` para los despachos sin zona, nivel o repartidor. */
export const nombreGrupo = (fila: Pick<FilaSla, "groupName">, agrupacion: AgrupacionSla) =>
  fila.groupName ?? SIN_GRUPO[agrupacion];

/**
 * Detalle ordenado por mayor demora promedio; sin demora, al final. Empata por más tardíos
 * y luego por nombre, para que el orden sea siempre el mismo.
 */
export function filasPorDemora(filas: readonly FilaSla[]): FilaSla[] {
  return [...filas].sort((a, b) => {
    const demoraA = a.averageDelayMinutes ?? -1;
    const demoraB = b.averageDelayMinutes ?? -1;
    if (demoraA !== demoraB) return demoraB - demoraA;
    if (a.lateCount !== b.lateCount) return b.lateCount - a.lateCount;
    return (a.groupName ?? "￿").localeCompare(b.groupName ?? "￿", "es", { sensitivity: "base" });
  });
}

export const cumpleUmbral = (porcentaje: number, umbral = UMBRAL_SLA_PORCENTAJE) => porcentaje >= umbral;

const decimal = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 });

export const formatoPorcentaje = (valor: number) => `${decimal.format(valor)} %`;

/** 18.5 → «18,5 min»; 143.2 → «2 h 23 min»; null → «—». */
export function formatoMinutos(valor: number | null): string {
  if (valor === null) return "—";
  if (valor < 60) return `${decimal.format(valor)} min`;
  const horas = Math.floor(valor / 60);
  const minutos = Math.round(valor - horas * 60);
  return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;
}

/** Texto para el usuario según el código del back. */
export function mensajeErrorSla(error: ApiError): string {
  if (error.code === "INVALID_DATE_RANGE") return MENSAJE_RANGO.invertido;
  if (error.code === "DATE_RANGE_TOO_LARGE") return MENSAJE_RANGO["muy-largo"];
  if (error.kind === "forbidden") return "Solo el Coordinador de Despachos puede ver este reporte.";
  return error.message;
}
