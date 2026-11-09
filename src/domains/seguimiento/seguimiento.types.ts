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
  /** Llegada estimada (ST-40.1). Solo en out_for_delivery e in_transit; null en otro caso. */
  eta?: EtaSeguimiento | null;
  /** Quién entrega. Solo en out_for_delivery e in_transit, y si la ruta tiene repartidor. */
  driver?: RepartidorSeguimiento | null;
  /** Última posición del repartidor. Solo en in_transit (es su turno) y si reportó una. */
  location?: UbicacionRepartidor | null;
  selfService: Autoservicio;
  /** Calificación del cliente (ST-42.1); null mientras no calificó. */
  rating?: CalificacionEntrega | null;
  /** Solo true si ya se entregó y todavía no se calificó. */
  canRate?: boolean;
}

/** Calificación guardada: respuesta del POST y campo `rating` del seguimiento. */
export interface CalificacionEntrega {
  /** Entero de 1 a 5. */
  score: number;
  /** Comentario opcional (ST-43.1); null si no dejó. */
  comment: string | null;
  createdAt: string;
}

/** Cuerpo de POST /public/tracking/:token/rating. Una sola calificación por entrega. */
export interface CalificarEntregaInput {
  score: number;
  /** Opcional, hasta 500 caracteres (ST-43.1). */
  comment?: string;
}

/** `osrm`: tiempo de manejo desde la última posición. `window`: sin posición u OSRM caído, se usa la franja prometida. */
export type FuenteEta = "osrm" | "window";

export interface EtaSeguimiento {
  /** Minutos que faltan (redondeado hacia arriba). Con `window`, los que faltan para el fin de la franja. */
  minutes: number;
  /** Cuándo se calculó: el back lo guarda hasta 60 s. */
  calculatedAt: string;
  source: FuenteEta;
}

export interface RepartidorSeguimiento {
  name: string;
  /** p. ej. «moto» o «camioneta»; null si la ruta no tiene vehículo. */
  vehicleType: string | null;
  vehiclePlate: string | null;
}

export interface UbicacionRepartidor {
  latitude: number;
  longitude: number;
  /** Cuándo la registró el celular del repartidor. */
  recordedAt: string;
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
