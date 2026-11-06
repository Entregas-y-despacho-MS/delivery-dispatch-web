export type EstadoFinalDespacho = "delivered" | "not_delivered" | "returned" | "returned_to_warehouse" | "cancelled";
export interface HistorialDespacho {
  id: number;
  trackingCode: string | null;
/** Estados finales: los únicos que aparecen en el historial (ST-55.2). */
export const ESTADOS_FINALES = ["delivered", "not_delivered", "returned", "returned_to_warehouse", "cancelled"] as const;
export type EstadoFinal = (typeof ESTADOS_FINALES)[number];

/** Columnas que el back sabe ordenar (`sortBy`). */
export const ORDENES_HISTORIAL = ["closedAt", "trackingCode", "recipient", "driver", "plate", "status"] as const;
export type OrdenHistorial = (typeof ORDENES_HISTORIAL)[number];

/** Una fila de GET /dispatches/history. */
export interface DespachoHistorial {
  id: number;
  trackingCode: string;
  recipient: string | null;
  driverId: number | null;
  driverName: string | null;
  plate: string | null;
  departedAt: string | null;
  deliveredAt: string | null;
  status: EstadoFinalDespacho;
  closedAt: string;
}
export interface HistorialResponse { data: HistorialDespacho[]; total: number; page: number; limit: number }
export interface HistorialParams {
  from?: string; to?: string; driverId?: number; plate?: string; status?: EstadoFinalDespacho;
  search?: string; sortBy?: "closedAt" | "trackingCode" | "recipient" | "driver" | "plate" | "status";
  order?: "asc" | "desc"; page: number; limit: number;
  /** Salida de la ruta, si quedó registrada. */
  departedAt: string | null;
  /** Solo en `delivered`. */
  deliveredAt: string | null;
  status: EstadoFinal | string;
  closedAt: string;
}

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
