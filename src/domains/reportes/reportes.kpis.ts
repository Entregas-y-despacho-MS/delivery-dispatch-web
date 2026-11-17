import type { FilaSla, IndicadoresFlota, PeriodoKpi } from "./types/reportes.types";

export const PERIODOS_KPI: readonly { valor: PeriodoKpi; etiqueta: string }[] = [
  { valor: "today", etiqueta: "Hoy" },
  { valor: "week", etiqueta: "Esta semana" },
  { valor: "month", etiqueta: "Este mes" },
];

export const PERIODO_KPI_POR_DEFECTO: PeriodoKpi = "week";

/** Lee `?periodo=` de la URL; lo inválido toma la semana. */
export function leerPeriodoKpi(params: URLSearchParams): PeriodoKpi {
  const valor = params.get("periodo");
  return PERIODOS_KPI.some((p) => p.valor === valor) ? (valor as PeriodoKpi) : PERIODO_KPI_POR_DEFECTO;
}

/** Un período sin despachos cerrados llega con ceros y listas vacías (escenario 2 de ES-61). */
export const sinDatosKpi = (indicadores: Pick<IndicadoresFlota, "totals">) => indicadores.totals.closedCount === 0;

export const nombreRepartidor = (fila: Pick<FilaSla, "groupName">) => fila.groupName ?? "Sin repartidor";
export const nombreVehiculo = (fila: Pick<FilaSla, "groupName">) => fila.groupName ?? "Sin vehículo";

export type ColumnaRanking = "nombre" | "cerrados" | "aTiempo" | "incidencias";
export type DireccionOrden = "asc" | "desc";

const VALOR: Record<Exclude<ColumnaRanking, "nombre">, (fila: FilaSla) => number> = {
  cerrados: (fila) => fila.closedCount,
  aTiempo: (fila) => fila.onTimePercentage,
  incidencias: (fila) => fila.incidentCount,
};

/** La primera vez que se ordena por una columna: los números de mayor a menor, el nombre de la A a la Z. */
export const direccionInicial = (columna: ColumnaRanking): DireccionOrden => (columna === "nombre" ? "asc" : "desc");

/**
 * Ranking de repartidores ordenado por la columna elegida. Empata por nombre, y los despachos sin
 * repartidor (`groupName: null`) quedan siempre al final: no son una persona a la que apoyar.
 */
export function ordenarRanking(filas: readonly FilaSla[], columna: ColumnaRanking, direccion: DireccionOrden): FilaSla[] {
  const signo = direccion === "asc" ? 1 : -1;
  const porNombre = (a: FilaSla, b: FilaSla) => nombreRepartidor(a).localeCompare(nombreRepartidor(b), "es", { sensitivity: "base" });
  return [...filas].sort((a, b) => {
    if ((a.groupName === null) !== (b.groupName === null)) return a.groupName === null ? 1 : -1;
    const diferencia = columna === "nombre" ? porNombre(a, b) : VALOR[columna](a) - VALOR[columna](b);
    return diferencia !== 0 ? diferencia * signo : porNombre(a, b);
  });
}

/** «02/11» a partir de «2026-11-02», igual en cualquier navegador (Intl no siempre respeta los dos dígitos). */
const dia = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Texto del rango que devolvió el back: «Del 02/11 al 08/11» o un solo día. */
export const textoRangoKpi = (desde: string, hasta: string) => (desde === hasta ? `Día ${dia(desde)}` : `Del ${dia(desde)} al ${dia(hasta)}`);
