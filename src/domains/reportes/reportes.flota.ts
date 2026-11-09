import type { ApiError } from "@/shared/lib/api-error";
import { celdaCsv, COLUMNAS_METRICAS, type Celda } from "./reportes.exportar";
import { nombreRepartidor, nombreVehiculo, type DireccionOrden } from "./reportes.kpis";
import { MENSAJE_RANGO } from "./reportes.reglas";
import type { FilaSla, MetricasSla } from "./reportes.types";
import { generarXlsx, type HojaXlsx } from "./reportes.xlsx";

/** Fila de vehículo de `GET /fleet/reports` (ST-65.1): las cifras del SLA más sus mantenimientos. */
export interface FilaVehiculoFlota extends FilaSla {
  /** Mantenimientos que se cruzan con el período. */
  maintenanceCount: number;
  /** Días de Bolivia en mantenimiento dentro del período (uno abierto cuenta hasta `to`). */
  daysInMaintenance: number;
}

/** Respuesta de `GET /fleet/reports?from&to` (ST-65.1). No trae totales. */
export interface ReporteFlota {
  /** YYYY-MM-DD, días de Bolivia, los dos incluidos. */
  from: string;
  to: string;
  /** Vacía si nada cerró en el período. Sin repartidor: `groupName: null`. */
  drivers: FilaSla[];
  /** Incluye vehículos que solo tuvieron mantenimiento (con las entregas en cero). */
  vehicles: FilaVehiculoFlota[];
}

export interface ParamsReporteFlota {
  from: string;
  to: string;
}

/** Sin despachos cerrados ni mantenimientos en el período. */
export const sinDatosFlota = (reporte: Pick<ReporteFlota, "drivers" | "vehicles">) =>
  reporte.drivers.length === 0 && reporte.vehicles.length === 0;

/** Solo los vehículos con entregas van al gráfico: un 0 % de un vehículo en taller no es una mala nota. */
export const vehiculosConEntregas = (filas: readonly FilaVehiculoFlota[]) => filas.filter((fila) => fila.deliveredCount > 0);

/**
 * Ordena por el valor elegido. Empata por nombre y deja siempre al final la fila sin nombre
 * (despachos sin repartidor o sin vehículo), igual que el ranking de KPIs.
 */
export function ordenarFilasFlota<T extends Pick<FilaSla, "groupName">>(
  filas: readonly T[],
  valor: (fila: T) => number | string,
  direccion: DireccionOrden,
  nombre: (fila: T) => string,
): T[] {
  const signo = direccion === "asc" ? 1 : -1;
  const porNombre = (a: T, b: T) => nombre(a).localeCompare(nombre(b), "es", { sensitivity: "base" });
  return [...filas].sort((a, b) => {
    if ((a.groupName === null) !== (b.groupName === null)) return a.groupName === null ? 1 : -1;
    const va = valor(a);
    const vb = valor(b);
    const diferencia = typeof va === "number" && typeof vb === "number"
      ? va - vb
      : String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
    return diferencia !== 0 ? diferencia * signo : porNombre(a, b);
  });
}

export function mensajeErrorFlota(error: ApiError): string {
  if (error.code === "INVALID_DATE_RANGE") return MENSAJE_RANGO.invertido;
  if (error.code === "DATE_RANGE_TOO_LARGE") return MENSAJE_RANGO["muy-largo"];
  if (error.kind === "forbidden") return "Solo el Supervisor de Flota y el Coordinador pueden ver este reporte.";
  return error.message;
}

/* ---------- Exportación (CSV y Excel en el navegador) ---------- */

export const COLUMNAS_VEHICULO_FLOTA = ["Vehículo", ...COLUMNAS_METRICAS, "Mantenimientos", "Días en mantenimiento"] as const;
export const COLUMNAS_REPARTIDOR_FLOTA = ["Repartidor", ...COLUMNAS_METRICAS] as const;

/** Mismo orden que COLUMNAS_METRICAS. Minutos y % como números, para poder sumar en la planilla. */
const celdasMetricas = (m: MetricasSla): Celda[] => [
  m.closedCount,
  m.deliveredCount,
  m.onTimeCount,
  m.lateCount,
  m.onTimePercentage,
  m.averageDelayMinutes,
  m.averageCycleMinutes,
  m.incidentCount,
];

interface TablaExportada {
  encabezado: string[];
  filas: Celda[][];
}

/** Lo que se exporta: los filtros aplicados y las dos tablas, por nombre y con las filas sin nombre al final. */
export function tablasExportacionFlota(reporte: ReporteFlota): { filtros: Celda[][]; vehiculos: TablaExportada; repartidores: TablaExportada } {
  const vehiculos = ordenarFilasFlota(reporte.vehicles, nombreVehiculo, "asc", nombreVehiculo);
  const repartidores = ordenarFilasFlota(reporte.drivers, nombreRepartidor, "asc", nombreRepartidor);
  return {
    filtros: [["Reporte de flota"], ["Desde", reporte.from], ["Hasta", reporte.to]],
    vehiculos: {
      encabezado: [...COLUMNAS_VEHICULO_FLOTA],
      filas: vehiculos.map((f) => [nombreVehiculo(f), ...celdasMetricas(f), f.maintenanceCount, f.daysInMaintenance]),
    },
    repartidores: {
      encabezado: [...COLUMNAS_REPARTIDOR_FLOTA],
      filas: repartidores.map((f) => [nombreRepartidor(f), ...celdasMetricas(f)]),
    },
  };
}

/** Para que Excel lea el CSV como UTF-8. */
const BOM = "\uFEFF";

/** RFC 4180 como el del reporte SLA: coma y CRLF. Las dos tablas, una debajo de la otra. */
export function generarCsvFlota(reporte: ReporteFlota): string {
  const { filtros, vehiculos, repartidores } = tablasExportacionFlota(reporte);
  const lineas: Celda[][] = [
    ...filtros,
    [],
    ["Vehículos"],
    vehiculos.encabezado,
    ...vehiculos.filas,
    [],
    ["Repartidores"],
    repartidores.encabezado,
    ...repartidores.filas,
  ];
  return BOM + lineas.map((celdas) => `${celdas.map(celdaCsv).join(",")}\r\n`).join("");
}

/** Excel con una hoja por tabla; cada hoja lleva arriba los filtros aplicados. */
export function hojasExcelFlota(reporte: ReporteFlota): HojaXlsx[] {
  const { filtros, vehiculos, repartidores } = tablasExportacionFlota(reporte);
  return [
    { nombre: "Vehículos", filas: [...filtros, [], vehiculos.encabezado, ...vehiculos.filas] },
    { nombre: "Repartidores", filas: [...filtros, [], repartidores.encabezado, ...repartidores.filas] },
  ];
}

export const generarExcelFlota = (reporte: ReporteFlota) => generarXlsx(hojasExcelFlota(reporte));

/** `reporte-flota-2026-10-01_2026-10-31.xlsx` */
export const nombreArchivoFlota = (reporte: Pick<ReporteFlota, "from" | "to">, extension: "csv" | "xlsx") =>
  `reporte-flota-${reporte.from}_${reporte.to}.${extension}`;
