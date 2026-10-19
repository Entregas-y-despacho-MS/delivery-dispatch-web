/**
 * Estados del lote de ruta (route_batches.status, migración 013 de delivery-dispatch-db).
 * En la 1.ª aprobación (ST-215) solo se trabaja con lotes `provisional`.
 */
export type EstadoLote =
  | "provisional"
  | "pending_final_review"
  | "confirmed"
  | "in_execution"
  | "closed"
  | "cancelled";

/** Versión que el coordinador vio de cada despacho; el back la compara antes de aprobar. */
export interface VersionDespacho {
  dispatchId: number;
  version: number;
}

/** Cuerpo de POST /route-batches/:id/approve-promises (ST-215.2). */
export interface AprobarPromesasPayload {
  /** Versión del lote que se mostró al coordinador. */
  version: number;
  /** Todas las filas del lote con su versión, incluidas las que se sacan. */
  dispatches: VersionDespacho[];
  /** Despachos que el coordinador saca del lote: vuelven a `pending` sin correo. */
  removeDispatchIds?: number[];
}

/** Resultado del correo de promesa de cada despacho aprobado. */
export type ResultadoCorreo = "sent" | "bounced" | "failed" | "skipped";

export interface CorreoPromesa {
  dispatchId: number;
  result: ResultadoCorreo;
}

/** Respuesta de POST /route-batches/:id/approve-promises. */
export interface AprobacionPromesas {
  routeBatchId: number;
  /** Versión del lote después de aprobar. */
  version: number;
  approvedCount: number;
  removedCount: number;
  /** Correos que se intentaron enviar después del commit. */
  emailCount: number;
  emailResults: CorreoPromesa[];
}

/** Uso de una medida del vehículo (kg o m³). */
export interface MedidaCapacidad {
  actual: number;
  capacity: number;
  usedPercent: number;
  remaining: number;
  /** Lo que sobrepasa la capacidad; 0 si entra. */
  excess: number;
}

export interface ExcesoDimension {
  dimension: "lengthCm" | "widthCm" | "heightCm";
  actual: number;
  maximum: number;
}

export interface BultoFueraDeMedida {
  dispatchId: number;
  packageId: number;
  exceeded: ExcesoDimension[];
}

/** Reporte de capacidad que devuelve el back al validar un vehículo. */
export interface ReporteCapacidad {
  /** Despachos sin bultos registrados: su peso es estimado. */
  estimatedDispatchIds: number[];
  weight: MedidaCapacidad;
  volume: MedidaCapacidad;
  dimensionViolations: BultoFueraDeMedida[];
  assignable: boolean;
}

/** Respuesta de PATCH /route-batches/:id/vehicle. */
export interface AsignacionVehiculoLote {
  routeBatchId: number;
  /** Versión del lote después del cambio. */
  version: number;
  status: EstadoLote;
  vehicleId: number;
  proposedDriverId: number | null;
  /** false: se mandó el mismo vehículo y no cambió nada. */
  changed: boolean;
  capacity: ReporteCapacidad;
}

/** Cuerpo de PATCH /route-batches/:id/vehicle: el back exige la versión del lote que se revisó. */
export interface AsignarVehiculoPayload {
  vehicleId: number;
  version: number;
}

/** Respuesta de PATCH /route-batches/:id/reviewer. */
export interface RevisorLote {
  id: number;
  status: EstadoLote;
  /** null: el lote no tiene revisor y lo ven todos los coordinadores. */
  reviewerUserId: number | null;
  /** Reasignar no cambia la versión del lote. */
  version: number;
}

/** Cuerpo de PATCH /route-batches/:id/reviewer. */
export interface ReasignarRevisorPayload {
  reviewerUserId: number;
  /** Motivo opcional; queda en la bitácora del lote. Máximo 500 caracteres. */
  reason?: string;
}

/** Cuerpo de POST /route-batches/:id/approve-final (ST-51.2, 2.ª aprobación). */
export interface AprobarLoteFinalPayload {
  /** Versión de planificación del lote que se mostró al coordinador. */
  version: number;
  /** Todos los despachos del lote con su versión; si cambió alguno, el back responde 409. */
  dispatches: VersionDespacho[];
}

/** Respuesta de POST /route-batches/:id/approve-final: el lote queda `confirmed` y sus pedidos `assigned`. */
export interface AprobacionFinal {
  routeBatchId: number;
  version: number;
  driverId: number;
  vehicleId: number;
  dispatchIds: number[];
}

/** Cuerpo de PATCH /route-batches/:id/driver (ST-51.6): conductor propuesto y versión revisada. */
export interface AsignarConductorPayload {
  driverId: number;
  version: number;
}

/**
 * Respuesta de PATCH /route-batches/:id/driver y /vehicle. En `pending_final_review` la corrección
 * se vuelve a validar: si no pasa, el lote vuelve a `provisional` con los motivos.
 */
export interface CorreccionLote {
  routeBatchId: number;
  version: number;
  status: EstadoLote;
  vehicleId: number | null;
  proposedDriverId: number | null;
  /** false: se mandó el mismo valor y no cambió nada. */
  changed: boolean;
  capacity: ReporteCapacidad | null;
}
