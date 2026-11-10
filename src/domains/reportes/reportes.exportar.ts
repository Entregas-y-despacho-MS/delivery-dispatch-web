import { etiquetaAgrupacion, filasPorDemora, nombreGrupo } from "./reportes.reglas";
import type { MetricasSla, ReporteSla } from "./reportes.types";

export type Celda = string | number | null;

/** Mismo formato que el CSV del historial (back, ST-55.2): RFC 4180, coma y CRLF. */
const SEPARADOR = ",";
const FIN_LINEA = "\r\n";
/** Para que Excel lea el archivo como UTF-8 (sin esto las tildes salen rotas). */
const BOM = "﻿";
// Una celda que empieza así se ejecuta como fórmula en Excel y Sheets (inyección CSV): los nombres de zona y de repartidor los escribe una persona.
const INICIO_FORMULA = /^[=+\-@\t\r]/;
const REQUIERE_COMILLAS = /[",\r\n]/;

export function celdaCsv(valor: Celda): string {
  if (valor === null) return "";
  let texto = String(valor);
  if (typeof valor === "string" && INICIO_FORMULA.test(texto)) texto = `'${texto}`;
  return REQUIERE_COMILLAS.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export const COLUMNAS_METRICAS = [
  "Cerrados",
  "Entregados",
  "A tiempo",
  "Con demora",
  "% a tiempo",
  "Demora promedio (min)",
  "Ciclo promedio (min)",
  "Incidencias",
] as const;

const metricas = (m: MetricasSla): Celda[] => [
  m.closedCount,
  m.deliveredCount,
  m.onTimeCount,
  m.lateCount,
  m.onTimePercentage,
  m.averageDelayMinutes,
  m.averageCycleMinutes,
  m.incidentCount,
];

/**
 * Lo que se ve en pantalla, listo para exportar: un encabezado con los filtros aplicados y la tabla
 * en el mismo orden (mayor demora primero) con la fila de totales. Los minutos y el % van como números,
 * sin unidades, para que se puedan sumar y ordenar en la planilla.
 */
export function tablaExportacion(reporte: ReporteSla): { filtros: Celda[][]; encabezado: string[]; filas: Celda[][] } {
  const grupo = etiquetaAgrupacion(reporte.groupBy);
  return {
    filtros: [
      ["Reporte de cumplimiento SLA"],
      ["Desde", reporte.from],
      ["Hasta", reporte.to],
      ["Agrupado por", grupo],
    ],
    encabezado: [grupo, ...COLUMNAS_METRICAS],
    filas: [
      ...filasPorDemora(reporte.rows).map((fila) => [nombreGrupo(fila, reporte.groupBy), ...metricas(fila)]),
      ["Total", ...metricas(reporte.totals)],
    ],
  };
}

export function generarCsv(reporte: ReporteSla): string {
  const { filtros, encabezado, filas } = tablaExportacion(reporte);
  const lineas = [...filtros, [], encabezado, ...filas];
  return BOM + lineas.map((celdas) => celdas.map(celdaCsv).join(SEPARADOR) + FIN_LINEA).join("");
}

/** `reporte-sla-zona-2026-10-01_2026-10-31.csv`: el período y la agrupación en el nombre. */
export function nombreArchivoSla(reporte: Pick<ReporteSla, "from" | "to" | "groupBy">, extension: "csv" | "xlsx"): string {
  const grupo = { zone: "zona", service_level: "nivel-servicio", zone_service: "zona-servicio", driver: "repartidor" }[reporte.groupBy];
  return `reporte-sla-${grupo}-${reporte.from}_${reporte.to}.${extension}`;
}

/** Descarga en el navegador, sin pasar por el back. */
export function descargarArchivo(contenido: BlobPart, tipo: string, nombre: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
