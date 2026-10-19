import type { EstadoLote, MedidaCapacidad, ReporteCapacidad } from "./planificacion.types";

/*
 * Lectura de lotes para la revisión (ST-215.5): GET /route-batches y GET /route-batches/:id.
 * Solo lectura: no cambia la versión del lote ni escribe eventos.
 */

export interface ZonaLote {
  id: number;
  code: string;
  name: string;
}

export interface VehiculoLote {
  id: number;
  plate: string;
  model: string;
  type: string;
}

export interface PersonaLote {
  id: number;
  fullName: string;
}

/** Medida de ocupación de la lista (sin restante ni exceso, que vienen en el detalle). */
export type OcupacionMedida = Pick<MedidaCapacidad, "actual" | "capacity" | "usedPercent">;

export interface OcupacionLote {
  weight: OcupacionMedida;
  volume: OcupacionMedida;
  /** Despachos sin bultos registrados: su peso es estimado. */
  estimatedDispatchIds: number[];
  assignable: boolean;
}

/** Fila de GET /route-batches. */
export interface LoteResumen {
  id: number;
  status: EstadoLote;
  version: number;
  /** Fecha de salida (AAAA-MM-DD). */
  shiftDate: string;
  zone: ZonaLote | null;
  vehicle: VehiculoLote | null;
  proposedDriver: PersonaLote | null;
  /** null: el lote no tiene revisor y lo ven todos los coordinadores. */
  reviewer: PersonaLote | null;
  dispatchCount: number;
  /** null: el lote todavía no tiene vehículo para comparar. */
  occupancy: OcupacionLote | null;
}

export interface BultoLote {
  id: number;
  externalPackageId: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
}

/** Pedido dentro del detalle del lote, en orden de visita. */
export interface PedidoLote {
  dispatchId: number;
  /** Se manda tal cual al aprobar; si cambió, el back responde 409. */
  version: number;
  status: string;
  sequenceOrder: number | null;
  sourceOrderRef: string;
  deliveryAddress: string;
  scheduledWindowStart: string | null;
  scheduledWindowEnd: string | null;
  /** Sin bultos registrados: su peso es estimado. */
  estimated: boolean;
  packages: BultoLote[];
}

/** Falla o advertencia que guardó el corte de D-1. */
export interface HallazgoValidacion {
  code: string;
  dispatchIds?: number[];
  detail?: string;
}

/** Último resultado de la validación del sistema (corte de D-1). */
export interface ValidacionLote {
  result: "validated" | "failed";
  occurredAt: string;
  reason: string | null;
  failures: HallazgoValidacion[];
  warnings: HallazgoValidacion[];
}

/** GET /route-batches/:id. */
export interface LoteDetalle extends LoteResumen {
  dispatches: PedidoLote[];
  capacity: ReporteCapacidad | null;
  validation: ValidacionLote | null;
}

/** Filtros de GET /route-batches. */
export type LotesParams = {
  page?: number;
  limit?: number;
  status?: EstadoLote;
  shiftDate?: string;
  reviewerUserId?: number;
  withoutReviewer?: boolean;
};

export interface LotesResponse {
  data: LoteResumen[];
  meta: { page: number; limit: number; pages: number; total: number };
}
