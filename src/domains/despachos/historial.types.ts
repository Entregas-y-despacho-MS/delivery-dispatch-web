export type EstadoFinalDespacho = "delivered" | "not_delivered" | "returned" | "returned_to_warehouse" | "cancelled";
export interface HistorialDespacho {
  id: number;
  trackingCode: string | null;
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
}
