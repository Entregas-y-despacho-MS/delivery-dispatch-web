/*
 * Ficha 360° de un despacho (ST-56.1, RF-A09): GET /dispatches/:id/detail.
 * Las URL de las evidencias son firmadas y vencen a los 5 minutos: se pide el detalle otra vez para renovarlas.
 */
import type { RecepcionAlmacen } from "./recepcion.types";

export interface RefCatalogo {
  id: number;
  name: string;
}

export interface UsuarioDetalle {
  id: number;
  fullName: string;
}

export interface BultoDetalle {
  id: number;
  externalPackageId: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
  handlingConditions: string[];
}

export interface DestinoDetalle {
  address: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
  zone: RefCatalogo | null;
}

export interface RutaDetalle {
  id: number;
  status: string;
  /** AAAA-MM-DD. */
  shiftDate: string;
  sequenceOrder: number | null;
  driver: UsuarioDetalle | null;
  vehicle: { id: number; plate: string; type: string; model: string } | null;
}

export type ActorEvento = "user" | "system" | "customer";

export interface EventoDetalle {
  id: number;
  eventType: string;
  detail: string | null;
  /** Estado al que pasó el despacho, si el evento es un cambio de estado. */
  status: string | null;
  reason: string | null;
  occurredAt: string;
  latitude: number | null;
  longitude: number | null;
  actorType: ActorEvento | null;
  operator: UsuarioDetalle | null;
}

export interface IncidenciaDetalle {
  id: string;
  reasonCode: string;
  reasonName: string;
  description: string | null;
  occurredAt: string;
}

export interface ReprogramacionDetalle {
  id: number;
  reasonCode: string;
  reasonName: string;
  rescheduledByType: "customer" | "coordinator" | "system";
  rescheduledBy: UsuarioDetalle | null;
  previousRouteBatchId: number | null;
  newRouteBatchId: number | null;
  previousWindowStart: string | null;
  previousWindowEnd: string | null;
  newWindowStart: string | null;
  newWindowEnd: string | null;
  createdAt: string;
}

export type TipoEvidencia = "photo" | "signature" | "otp";

export interface EvidenciaDetalle {
  id: string;
  type: TipoEvidencia;
  /** URL firmada de corta duración; null para un OTP (no tiene archivo). */
  accessUrl: string | null;
  accessUrlExpiresAt: string | null;
  capturedAt: string;
  latitude: number | null;
  longitude: number | null;
  receiverName: string | null;
  receiverDocument: string | null;
}

export interface SupplierPickupItemDetalle {
  itemCode: string;
  description: string | null;
  expectedQuantity: number;
  receivedQuantity: number | null;
}

export interface SupplierPickupDetalle {
  originAddress: string;
  originReference: string | null;
  originLatitude: number | null;
  originLongitude: number | null;
  supplierContactName: string | null;
  supplierContactPhone: string | null;
  destinationWarehouse: { id: number; code: string; name: string } | null;
  items: SupplierPickupItemDetalle[];
  estimatedPackages: number | null;
  estimatedWeightKg: number | null;
  estimatedVolumeM3: number | null;
}

export interface DespachoDetalle {
  id: number;
  trackingCode: string | null;
  sourceOrderRef: string;
  type: RefCatalogo;
  status: RefCatalogo;
  priority: "urgent" | "normal";
  serviceLevel: RefCatalogo | null;
  evidencePolicy: string | null;
  paymentStatusLabel: string | null;
  /** Opinión del cliente (ST-43.1), null hasta que califique. */
  rating: { score: number; comment: string | null; createdAt: string } | null;
  /** Datos propios de recojo a proveedor; null para entregas y otros tipos. */
  supplierPickup?: SupplierPickupDetalle | null;
  /**
   * Recepción en almacén (ST-240.6), null si el despacho no tiene. Opcional: el back la agrega en
   * ST-240.6 y hasta entonces no la manda.
   */
  receipt?: RecepcionAlmacen | null;
  scheduledWindowStart: string | null;
  scheduledWindowEnd: string | null;
  createdAt: string;
  destination: DestinoDetalle;
  packages: BultoDetalle[];
  route: RutaDetalle | null;
  /** Firma con el receptor; null si nadie firmó. */
  receiver: EvidenciaDetalle | null;
  timeline: EventoDetalle[];
  incidents: IncidenciaDetalle[];
  reschedules: ReprogramacionDetalle[];
  evidences: EvidenciaDetalle[];
}
