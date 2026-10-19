/** Lo que pidió el cliente desde la página pública (ST-224.2). */
export interface PedidoDeCambio {
  /** Texto del cliente; puede venir vacío. */
  detail: string | null;
  requestedAt: string;
  /** El cliente pidió el cambio con su ventana de 12 h todavía abierta. */
  responseWindowWasOpen: boolean;
  /** Por qué ya no podía reprogramar solo (ventana vencida, límite alcanzado…). */
  selfServiceClosedReason: string | null;
}

/** Una fila de GET /dispatches/change-requests. Nunca trae enlace, correo, teléfono ni dirección. */
export interface SolicitudCambio {
  dispatchId: number;
  trackingCode: string;
  status: string;
  routeBatchId: number | null;
  /** Fecha de la ruta, YYYY-MM-DD. */
  deliveryDate: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  zoneId: number | null;
  zoneName: string | null;
  contactName: string | null;
  hasContactEmail: boolean;
  request: PedidoDeCambio;
  /** Si es false, no sale la orden de preparación hasta que el coordinador resuelva. */
  promiseIsFirm: boolean;
  promiseFirmedAt: string | null;
  /** Coordinador, cliente sin correo y token vigente. Para el supervisor siempre es false. */
  canRevealTrackingLink: boolean;
}

export interface SolicitudesCambioParams {
  [clave: string]: string | number | undefined;
  page: number;
  limit: number;
  delivery_zone_id?: number;
  date?: string;
  search?: string;
}

export interface SolicitudesCambioResponse {
  data: SolicitudCambio[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export interface EnlaceSeguimiento {
  dispatchId: number;
  trackingUrl: string;
}
