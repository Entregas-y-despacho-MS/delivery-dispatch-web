/** Motivo que dio el repartidor al cotejar un bulto (ST-210 / ST-241.3). */
export type MotivoFallaCotejo = "missing" | "damaged" | "does_not_fit";

/** Un bulto que falló el cotejo y sigue sin resolver. */
export interface FallaCotejo {
  packageId: string;
  reason: MotivoFallaCotejo | string;
  detail: string | null;
  /** URL firmada de la foto (vence en unos 5 minutos; pide la lista otra vez para renovarla). */
  photoUrl: string | null;
  reportedAt: string;
}

/** Una parada que quedó fuera de la ruta por falla de cotejo (GET /route-batches/cotejo-exclusions). */
export interface ExcluidoCotejo {
  dispatchId: number;
  routeBatchId: number;
  /** Fecha del lote, YYYY-MM-DD. */
  shiftDate: string;
  sequenceOrder: number | null;
  sourceOrderRef: string;
  trackingCode: string | null;
  deliveryAddress: string;
  contactName: string | null;
  failures: FallaCotejo[];
}

export interface ExcluidosCotejoResponse {
  data: ExcluidoCotejo[];
}

export interface CotejoResuelto {
  dispatchId: number;
  routeBatchId: number;
  resolvedAt: string;
}

export interface DespachoCancelado {
  dispatchId: number;
  status: string;
  previousStatus: string;
  closedAt: string;
  reasonCode: string;
  routeBatchId: number | null;
  /** El lote se cerró porque esta era su última parada abierta. */
  routeBatchClosed: boolean;
}
