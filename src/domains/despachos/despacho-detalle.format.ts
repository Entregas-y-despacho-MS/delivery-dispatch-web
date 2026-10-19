import type { ActorEvento, EvidenciaDetalle, EventoDetalle, TipoEvidencia } from "./despacho-detalle.types";

const ZONA = "America/La_Paz";
const fechaHora = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: ZONA,
});
const hora = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA });
const fecha = new Intl.DateTimeFormat("es-BO", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** Fecha y hora exacta en Bolivia, p. ej. «19/10/2026, 14:05:32». */
export const formatearFechaHoraExacta = (valor: string) => fechaHora.format(new Date(valor));

/** Franja en hora de Bolivia, p. ej. «08:00–10:00». */
export function formatearVentana(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Sin franja";
  return fin ? `${hora.format(new Date(inicio))}–${hora.format(new Date(fin))}` : hora.format(new Date(inicio));
}

const diaCorto = new Intl.DateTimeFormat("es-BO", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: ZONA });

/** Franja con su día, p. ej. «lun., 19/10 08:00–10:00»; para comparar reprogramaciones. */
export function formatearVentanaConDia(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Sin franja";
  return `${diaCorto.format(new Date(inicio))} ${formatearVentana(inicio, fin)}`;
}

/** Fecha de turno (AAAA-MM-DD) en UTC para no correrla un día, p. ej. «lun., 19/10». */
export function formatearFechaTurnoDetalle(valor: string): string {
  const [anio, mes, dia] = valor.split("-").map(Number);
  if (!anio || !mes || !dia) return valor;
  return fecha.format(new Date(Date.UTC(anio, mes - 1, dia)));
}

/** Coordenadas con 5 decimales (~1 m); null si el evento no las registró. */
export function formatearCoordenadas(latitud: number | null, longitud: number | null): string | null {
  if (latitud === null || longitud === null) return null;
  return `${latitud.toFixed(5)}, ${longitud.toFixed(5)}`;
}

export const enlaceMapa = (latitud: number, longitud: number) => `https://www.google.com/maps?q=${latitud},${longitud}`;

const ESTADOS: Record<string, string> = {
  pending: "Pendiente",
  address_review: "Dirección en revisión",
  in_planning: "En planificación",
  scheduled: "Programado",
  assigned: "Asignado",
  out_for_delivery: "Salió a reparto",
  in_transit: "En camino",
  delivered: "Entregado",
  not_delivered: "No entregado",
  incident: "Con incidencia",
  rescheduled: "Reprogramado",
  returned: "Devuelto",
  returned_to_warehouse: "Devuelto al almacén",
  pickup_scheduled: "Recojo programado",
  picked_up_in_transit: "Recogido, en camino",
  cancelled: "Cancelado",
};

export const etiquetaEstadoDespacho = (estado: string) => ESTADOS[estado] ?? estado;

const EVENTOS: Record<string, string> = {
  status_changed: "Cambio de estado",
  created: "Pedido creado",
  promise_approved: "Promesa aprobada",
  promise_email_sent: "Correo de promesa enviado",
  promise_email_bounced: "Correo de promesa rebotado",
  promise_firmed: "Promesa firme",
  removed_from_provisional_batch: "Sacado del lote provisional",
  change_requested: "El cliente pidió un cambio",
  customer_rescheduled: "El cliente eligió otro horario",
  rescheduled: "Reprogramado",
  returned_to_warehouse: "Devuelto al almacén",
  incident_reported: "Incidencia reportada",
  evidence_registered: "Evidencia registrada",
  otp_sent: "OTP enviado",
  otp_resent: "OTP reenviado",
  priority_changed: "Cambio de prioridad",
};

/** Nombre del evento para el coordinador; uno desconocido se muestra legible («algo_nuevo» → «Algo nuevo»). */
export function etiquetaEvento(tipo: string): string {
  if (EVENTOS[tipo]) return EVENTOS[tipo];
  const texto = tipo.replace(/[_.]+/g, " ").trim();
  return texto ? texto[0].toUpperCase() + texto.slice(1) : tipo;
}

const ACTORES: Record<ActorEvento, string> = { user: "Operador", system: "Sistema", customer: "Cliente" };

/** Quién originó el evento: el operador con nombre o, si no hay, sistema / cliente. */
export function quienOrigino(evento: Pick<EventoDetalle, "operator" | "actorType">): string {
  if (evento.operator) return evento.operator.fullName;
  return evento.actorType ? ACTORES[evento.actorType] : "Sin registro";
}

const TIPOS_EVIDENCIA: Record<TipoEvidencia, string> = { photo: "Fotografía", signature: "Firma", otp: "Código OTP" };

export const etiquetaEvidencia = (tipo: TipoEvidencia) => TIPOS_EVIDENCIA[tipo];

/**
 * La URL firmada ya no sirve (o está a menos de 10 s de vencer): hay que pedir el detalle otra vez.
 * Un OTP no tiene URL y nunca vence.
 */
export function urlVencida(evidencia: Pick<EvidenciaDetalle, "accessUrl" | "accessUrlExpiresAt">, ahora: number): boolean {
  if (!evidencia.accessUrl || !evidencia.accessUrlExpiresAt) return false;
  return new Date(evidencia.accessUrlExpiresAt).getTime() - ahora <= 10_000;
}
