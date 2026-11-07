/** Agrupaciones de `GET /reports/sla` (ST-54.2). */
export type AgrupacionSla = "zone" | "service_level" | "driver";

/** Cifras de un grupo o del total, tal como las devuelve el back. */
export interface MetricasSla {
  /** Despachos de entrega cerrados en el rango (sin cancelados). */
  closedCount: number;
  deliveredCount: number;
  /** Entregados dentro de la franja comprometida. */
  onTimeCount: number;
  /** Entregados después del fin de la franja. */
  lateCount: number;
  /** % a tiempo sobre los entregados, con un decimal. 0 si no se entregó nada. */
  onTimePercentage: number;
  /** Minutos promedio de demora de los tardíos; null si ninguno llegó tarde. */
  averageDelayMinutes: number | null;
  /** Minutos promedio desde la salida (out_for_delivery) hasta la entrega; null si no hay datos. */
  averageCycleMinutes: number | null;
  incidentCount: number;
}

export interface FilaSla extends MetricasSla {
  /** null: despachos sin zona, nivel o repartidor. */
  groupId: number | null;
  groupName: string | null;
}

export interface ReporteSla {
  /** YYYY-MM-DD, día de Bolivia, incluido. */
  from: string;
  to: string;
  groupBy: AgrupacionSla;
  totals: MetricasSla;
  /** Ordenadas por nombre; vacía si nada cerró en el rango. */
  rows: FilaSla[];
}

export interface ParamsReporteSla {
  from: string;
  to: string;
  groupBy: AgrupacionSla;
}

/** Filtros de la pantalla (viven en la URL). */
export interface FiltrosSla {
  desde: string;
  hasta: string;
  agrupacion: AgrupacionSla;
}
