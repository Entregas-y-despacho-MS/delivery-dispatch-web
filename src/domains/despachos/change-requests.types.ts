export interface SolicitudCambio {
  dispatchId: number; trackingCode: string | null; status: string; routeBatchId: number | null;
  deliveryDate: string | null; windowStart: string | null; windowEnd: string | null;
  zoneId: number | null; zoneName: string | null; contactName: string | null; hasContactEmail: boolean;
  request: { detail: string | null; requestedAt: string; responseWindowWasOpen: boolean | null; selfServiceClosedReason: string | null };
  promiseIsFirm: boolean; promiseFirmedAt: string | null; canRevealTrackingLink: boolean;
}
export interface SolicitudesCambioResponse { data: SolicitudCambio[]; total: number; page: number; limit: number }
