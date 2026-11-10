/*
 * Órdenes de recojo de devolución (ST-81.1 web, ST-81.2 back): GET, POST y PATCH /pickup-orders.
 * Un recojo es un despacho de tipo `warehouse_return_pickup`; su estado usa los mismos nombres.
 */
import type { ResultadoRecepcion } from "./recepcion.types";

/** `manual`: lo registró el coordinador. `rma`: llegó desde el sistema de devoluciones. */
export type OrigenRecojo = "manual" | "rma";

export interface AlmacenDestino {
  id: number;
  code: string;
  name: string;
}

/** Una fila de GET /pickup-orders. */
export interface Recojo {
  id: number;
  trackingCode: string | null;
  /** Referencia de origen (número de RMA o la generada para los manuales). */
  sourceOrderRef: string;
  origin: OrigenRecojo;
  status: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  returnReason: string | null;
  packageContents: string | null;
  estimatedBoxes: number | null;
  /** AAAA-MM-DD. */
  preferredPickupDate: string | null;
  destinationWarehouse: AlmacenDestino | null;
  createdAt: string;
  /** Resultado de la recepción en almacén (ST-240.6); null mientras no la haya. Opcional hasta que el back la mande. */
  receiptResult?: ResultadoRecepcion | null;
}

export interface RecojosResponse {
  data: Recojo[];
  meta: { page: number; limit: number; pages: number; total: number };
}

/** Filtros del listado. `from` y `to` (AAAA-MM-DD) se comparan con la fecha preferida. */
export type RecojoListParams = {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
  origin?: OrigenRecojo;
};

/** Cuerpo de POST /pickup-orders (solo coordinador). La franja la asigna el planificador. */
export interface CrearRecojoInput {
  warehouseCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string | null;
  address: string;
  reference?: string | null;
  latitude: number;
  longitude: number;
  preferredPickupDate: string;
  packageContents: string;
  estimatedBoxes?: number | null;
  returnReason: string;
  rmaId?: string | null;
}

/** Un almacén de GET /warehouses, para elegir el destino. */
export interface Almacen {
  id: number;
  code: string;
  name: string;
  address: string;
  active: boolean;
}
