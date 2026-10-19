/*
 * Portal público del cliente final (ST-224.2, RF-U14 y RF-U21): GET y POST de /public/tracking/:token.
 * El token del enlace es la única credencial; el código de seguimiento nunca da acceso.
 */

/** Por qué terminó el autoservicio; null mientras sigue abierto. */
export type MotivoCierre =
  | "not_open"
  | "change_requested"
  | "no_valid_notice"
  | "window_elapsed"
  | "confirmed"
  | "max_attempts";

/** Lo que el cliente todavía puede hacer desde el enlace. */
export interface Autoservicio {
  open: boolean;
  closedReason: MotivoCierre | null;
  /** Fin de la ventana original de respuesta (no se reinicia al reprogramar). */
  windowClosesAt: string | null;
  rescheduleAttemptsLeft: number;
  canConfirm: boolean;
  canReschedule: boolean;
  canRequestChange: boolean;
}

/** Respuesta de GET /public/tracking/:token y de confirmar, reprogramar o pedir cambio. */
export interface SeguimientoPublico {
  trackingCode: string | null;
  status: string;
  /** pending, confirmed, rescheduled o change_requested. */
  customerConfirmation: string;
  /** AAAA-MM-DD; null mientras no tiene ruta. */
  deliveryDate: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  selfService: Autoservicio;
}

export interface CodigoEnviado {
  /** Correo registrado, parcialmente oculto: «c***@correo.com». */
  sentTo: string;
  expiresAt: string;
}

/** Prueba de un solo uso: va en la cabecera X-Verification-Proof, nunca en la URL. */
export interface PruebaVerificacion {
  proof: string;
  expiresAt: string;
}

export interface FranjaDisponible {
  slotId: string;
  deliveryDate: string;
  windowStart: string;
  windowEnd: string;
}

export type MotivoSinFranjas = "no_slots" | "planning_not_configured" | "no_location";

export interface FranjasDisponibles {
  slots: FranjaDisponible[];
  unavailableReason: MotivoSinFranjas | null;
}
