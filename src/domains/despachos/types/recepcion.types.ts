/*
 * Recepción en almacén de un recojo o de una recogida en proveedor (ST-240.6 back, ST-240.5 web).
 * La ficha la lee de `receipt` en GET /dispatches/:id/detail y Recojos de `receiptResult` en GET /pickup-orders.
 */

/** Cómo terminó la recepción. La web los muestra como «Recibido», «Con diferencias» y «Rechazado». */
export type ResultadoRecepcion = "complete" | "with_differences" | "rejected";

/** Un ítem recibido: se identifica por `itemCode` (producto) o por `packageId` (bulto rastreado). */
export interface ItemRecepcion {
  itemCode: string | null;
  packageId: number | null;
  acceptedQuantity: number;
  missingQuantity: number;
  damagedQuantity: number;
  /** Detalle libre de la diferencia; null si no hay. */
  detail: string | null;
}

export interface RecepcionAlmacen {
  result: ResultadoRecepcion;
  /** ISO 8601: cuándo el almacén recibió la mercadería. */
  receivedAt: string;
  notes: string | null;
  /** Vacío si el almacén no mandó el detalle. */
  items: ItemRecepcion[];
}
