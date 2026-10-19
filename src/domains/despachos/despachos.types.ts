/** Turno de la franja pactada (hora de Bolivia): mañana empieza antes de las 12:00. */
export type TurnoPedido = "morning" | "afternoon";

export type PrioridadPedido = "urgent" | "normal";

/**
 * Situación del pedido dentro de la bandeja (campo `inbox` de ST-48.2):
 * - `reserved`: un coordinador tiene una reserva vigente.
 * - `proposed`: `in_planning` armado por el generador, sin reserva.
 * - `null`: pedido libre.
 */
export type SituacionBandeja = "reserved" | "proposed" | null;

export interface ReservaPedido {
  reservedById: number;
  /** Se muestra como «En planificación por [Nombre]». */
  reservedByName: string;
  expiresAt: string;
  /** La reserva es del coordinador autenticado: sus propios pedidos no se bloquean. */
  reservedByMe: boolean;
}

/** Pedido pendiente de planificación, tal como lo devuelve GET /pending-orders. */
export interface PedidoPendiente {
  id: number;
  orderNumber: string;
  trackingCode: string | null;
  recipient: string | null;
  recipientPhone: string | null;
  address: string;
  zoneId: number | null;
  zoneName: string | null;
  shift: TurnoPedido | null;
  windowStart: string | null;
  windowEnd: string | null;
  priority: PrioridadPedido;
  /** Estado real del despacho. La reserva suave nunca lo cambia. */
  status: string;
  inbox: SituacionBandeja;
  slaDueAt: string | null;
  packagesCount: number;
  weightKg: number;
  volumeM3: number;
  /** Otro coordinador lo está planificando: no se puede seleccionar. */
  locked: boolean;
  /**
   * Solo lectura: se muestra pero no se puede seleccionar ni reservar (hoy, los `address_review`:
   * la dirección debe validarse antes de planificarlo). Si se intenta reservar, el back responde 409.
   */
  readOnly: boolean;
  reservation: ReservaPedido | null;
}

/** Columnas por las que el servidor sabe ordenar. */
export type OrdenBandeja = "orderNumber" | "recipient" | "zone" | "window" | "weight" | "priority";

export type PedidosPendientesParams = {
  page?: number;
  limit?: number;
  search?: string;
  delivery_zone_id?: number;
  shift?: TurnoPedido;
  priority?: PrioridadPedido;
  sortBy?: OrdenBandeja;
  order?: "asc" | "desc";
};

/** La bandeja responde { data, total, page, limit }, no el { data, meta } de los catálogos. */
export interface PedidosPendientesResponse {
  data: PedidoPendiente[];
  total: number;
  page: number;
  limit: number;
}

/** Tarjeta del tablero Kanban (GET /dispatches/kanban). */
export interface DespachoKanban {
  id: number;
  sourceOrderRef: string;
  trackingCode: string | null;
  status: string;
  dispatchType: { id: number; name: string };
  zone: { id: number; name: string } | null;
  driver: { id: number; fullName: string } | null;
  vehicle: { id: number; plate: string } | null;
  windowStart: string | null;
  windowEnd: string | null;
  priority: string;
  volumeM3: number;
  attemptCount: number;
  attemptLimit: number;
  routeBatch: { id: number; status: string } | null;
  inbox: SituacionBandeja;
  reservation: ReservaPedido | null;
}

export type ColumnaKanbanKey =
  | "pending" | "in_planning" | "scheduled" | "assigned" | "out_for_delivery"
  | "in_transit" | "delivered" | "incident" | "rescheduled"
  | "pickup_scheduled" | "picked_up_in_transit" | "returned_to_warehouse" | "returned";

export interface ColumnaKanban {
  key: ColumnaKanbanKey;
  statuses: string[];
  label: string;
  ordersCount: number;
  volumeM3: number;
  dispatches: DespachoKanban[];
}

export interface TableroKanban {
  date: string;
  columns: ColumnaKanban[];
}

/** Catálogos de filtros, independientes de los despachos de la fecha consultada. */
export interface TableroKanbanFiltrosCatalogo {
  drivers: { id: number; fullName: string }[];
  dispatchTypes: { id: number; name: string }[];
}

export interface FiltrosTableroKanban {
  date: string;
  delivery_zone_id?: number;
  driver_id?: number;
  dispatch_type_id?: number;
}
