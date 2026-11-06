/** Estados finales: los únicos que aparecen en el historial (ST-55.2). */
export const ESTADOS_FINALES = ["delivered", "not_delivered", "returned", "returned_to_warehouse", "cancelled"] as const;
export type EstadoFinal = (typeof ESTADOS_FINALES)[number];

/** Alias conservado para consumidores del contrato anterior. */
export type EstadoFinalDespacho = EstadoFinal;

/** Columnas que el back sabe ordenar (`sortBy`). */
export const ORDENES_HISTORIAL = ["closedAt", "trackingCode", "recipient", "driver", "plate", "status"] as const;
export type OrdenHistorial = (typeof ORDENES_HISTORIAL)[number];

/** Una fila de GET /dispatches/history. */
export interface DespachoHistorial {
  id: number;
  trackingCode: string | null;
  recipient: string | null;
  driverId: number | null;
  driverName: string | null;
  plate: string | null;
  /** Salida de la ruta, si quedó registrada. */
  departedAt: string | null;
  /** Solo en `delivered`. */
  deliveredAt: string | null;
  status: EstadoFinal;
  closedAt: string;
}

/** Alias conservado para consumidores del contrato anterior. */
export type HistorialDespacho = DespachoHistorial;

export interface HistorialParams {
  [clave: string]: string | number | undefined;
  page: number;
  limit: number;
  from?: string;
  to?: string;
  driverId?: number;
  plate?: string;
  status?: EstadoFinal;
  search?: string;
  sortBy?: OrdenHistorial;
  order?: "asc" | "desc";
}

export interface HistorialResponse {
  data: DespachoHistorial[];
  total: number;
  page: number;
  limit: number;
}
