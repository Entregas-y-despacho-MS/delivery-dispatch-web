/*
 * Auditoría de acciones administrativas (ST-70.2 web, ST-70.1 back): GET /audit/admin-events.
 * Solo el administrador (y root) puede consultarla; `ip` y `metadata` solo llegan a root.
 */

export type ResultadoAuditoria = "success" | "denied" | "failed";
export type OrdenAuditoria = "asc" | "desc";

/** Un evento tal como lo devuelve el back. */
export interface EventoAuditoria {
  eventId: string;
  /** UTC. */
  occurredAt: string;
  /** null si la petición no tenía usuario autenticado. */
  actorId: number | null;
  /** Rol que tenía el actor en ese momento (`admin`, `coordinator`, …); null sin actor. */
  actorRole: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  result: ResultadoAuditoria;
  statusCode: number | null;
  /** X-Request-Id de la petición. */
  correlationId: string;
  /** Solo para root. */
  ip?: string | null;
  /** Solo para root: campos declarados del body (nunca secretos ni datos personales). */
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AuditoriaResponse {
  data: EventoAuditoria[];
  meta: { page: number; limit: number; pages: number; total: number };
}

/** Parámetros de GET /audit/admin-events. `from` incluido y `to` excluido, ambos con zona explícita. */
export type AuditoriaParams = {
  from: string;
  to: string;
  page?: number;
  limit?: number;
  actorId?: number;
  actorRole?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  result?: ResultadoAuditoria;
  correlationId?: string;
  order?: OrdenAuditoria;
};
