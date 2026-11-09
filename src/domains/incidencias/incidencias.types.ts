import type { PaginatedApiResponse } from "@/shared/lib/base.service";

/** Qué levantó la alerta (`OperationalAlertKindEnum`, ST-66.2). */
export type TipoAlerta = "critical_incident" | "gps_stale" | "driver_incidents" | "sla_below_threshold";

/** `critical_incident` siempre es crítica; las de umbral son advertencias. */
export type SeveridadAlerta = "critical" | "warning";

/** Abierta hasta que un supervisor o coordinador la marca como atendida. */
export type EstadoAlerta = "open" | "acknowledged";

/** Una alerta de `GET /alerts`, tal como la devuelve el back. */
export interface AlertaOperativa {
  id: number;
  kind: TipoAlerta;
  severity: SeveridadAlerta;
  /** null: la alerta no corresponde a una zona concreta. */
  zoneId: number | null;
  /** Solo en `critical_incident`. */
  dispatchId: number | null;
  /** null solo en `sla_below_threshold`. */
  driverId: number | null;
  /** Vehículo que usaba el repartidor, si se conoce. */
  vehicleId: number | null;
  /** Contexto propio de cada tipo (motivo, valor medido, umbral...). */
  detail: Record<string, unknown>;
  status: EstadoAlerta;
  acknowledgedBy: number | null;
  /** ISO 8601; null mientras está abierta. */
  acknowledgedAt: string | null;
  /** ISO 8601. */
  createdAt: string;
}

export type RespuestaAlertas = PaginatedApiResponse<AlertaOperativa>;

/** Payload del socket `operational.alert_raised`: solo llega cuando se creó una alerta nueva. */
export type AlertaLevantada = Pick<AlertaOperativa, "id" | "kind" | "severity" | "zoneId" | "dispatchId" | "driverId" | "detail">;

/** Filtros de la página Alertas; viven en la URL. */
export interface FiltrosAlertas {
  tipo: TipoAlerta | "todos";
  estado: EstadoAlerta | "todas";
}

/** Query de `GET /alerts`: el back solo filtra por estado. */
export interface ParamsAlertas {
  status?: EstadoAlerta;
  page: number;
  limit: number;
}
