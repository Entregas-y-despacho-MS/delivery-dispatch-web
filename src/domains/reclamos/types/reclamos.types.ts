/*
 * Reclamos de entregas que abre el CRM (ST-45.2, ES-45, RF-U22): GET /complaint-cases y sus tres comandos.
 * El back no manda datos del cliente (nombre, teléfono, correo, dirección) ni URL de evidencia.
 */

export type EstadoReclamo = "received" | "assigned" | "in_investigation" | "decided";

export type SiguienteAccion = "assign" | "start_investigation" | "issue_verdict" | "await_inventory_authorization" | "none";

export type Dictamen = "no_return_required" | "request_RMA" | "not_confirmed";

/** Fila de la bandeja. */
export interface Reclamo {
  complaintId: number;
  crmCaseId: string;
  dispatchId: number;
  trackingCode: string | null;
  /** Versión que mandó el CRM: los comandos la devuelven en `expectedVersion`. */
  caseVersion: number;
  reasonCode: string;
  investigationStatus: EstadoReclamo;
  nextAction: SiguienteAccion;
  /** true solo si el despacho está entregado: el único estado que se investiga. */
  eligible: boolean;
  dispatchStatus: string;
  zoneId: number | null;
  zoneName: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  verdict: Dictamen | null;
  /** request_RMA esperando que Inventarios apruebe o rechace. */
  authorizationPending: boolean;
  receivedAt: string;
  openedAt: string;
  assignedAt: string | null;
  decidedAt: string | null;
  updatedAt: string;
}

export interface ItemAfectado {
  packageId: string;
  itemCode: string;
  quantity: number;
}

/** GET /complaint-cases/:id y respuesta de los tres comandos. */
export interface ReclamoDetalle extends Reclamo {
  investigationStartedAt: string | null;
  findings: string | null;
  decisionReason: string | null;
  decidedByUserId: number | null;
  decidedByUserName: string | null;
  authorizationRequestId: string | null;
  rmaId: string | null;
  affectedItems: ItemAfectado[];
  routeBatchId: number | null;
  routeBatchStatus: string | null;
}

export interface ReclamosResponse {
  data: Reclamo[];
  meta: { page: number; limit: number; pages: number; total: number };
}

/** Query de GET /complaint-cases. Fechas AAAA-MM-DD, días de Bolivia, ambas incluidas. */
export type ReclamosParams = {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  zoneId?: number;
  reasonCode?: string;
  status?: EstadoReclamo;
  assignedUserId?: number;
};

export interface DictamenInput {
  verdict: Dictamen;
  decisionReason: string;
  findings: string;
}
