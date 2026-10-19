import type { Autoservicio } from "./seguimiento.types";

const ZONA = "America/La_Paz";
const fechaLarga = new Intl.DateTimeFormat("es-BO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const hora = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA });
const fechaHora = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA });

/** Fecha de entrega (AAAA-MM-DD), p. ej. «sábado, 19 de octubre». En UTC para no correrla un día. */
export function formatearFechaEntrega(fecha: string | null): string {
  if (!fecha) return "Todavía sin fecha";
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  return fechaLarga.format(new Date(Date.UTC(anio, mes - 1, dia)));
}

/** Franja en hora de Bolivia, p. ej. «08:00 a 10:00». */
export function formatearFranjaEntrega(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Todavía sin horario";
  return fin ? `${hora.format(new Date(inicio))} a ${hora.format(new Date(fin))}` : hora.format(new Date(inicio));
}

/** Hora en Bolivia, p. ej. «20:30». */
export const formatearHora = (valor: string) => hora.format(new Date(valor));

/** Fecha y hora corta en hora de Bolivia, p. ej. «18/10, 20:30». */
export const formatearFechaHora = (valor: string) => fechaHora.format(new Date(valor));

const ESTADOS: Record<string, string> = {
  pending: "Pedido recibido",
  address_review: "Revisando la dirección",
  in_planning: "Preparando tu entrega",
  scheduled: "Entrega programada",
  assigned: "Asignado a un repartidor",
  out_for_delivery: "En camino",
  in_transit: "En camino",
  delivered: "Entregado",
  not_delivered: "No se pudo entregar",
  incident: "Con una incidencia",
  rescheduled: "Reprogramado",
  returned: "Devuelto",
  returned_to_warehouse: "Devuelto al almacén",
  pickup_scheduled: "Recojo programado",
  picked_up_in_transit: "Recogido, en camino",
  cancelled: "Cancelado",
};

/** Estado del pedido en palabras del cliente; uno desconocido se muestra tal cual. */
export const etiquetaEstado = (estado: string) => ESTADOS[estado] ?? estado;

const RESPUESTAS: Record<string, string> = {
  pending: "Esperando tu respuesta",
  confirmed: "Confirmaste la entrega",
  rescheduled: "Elegiste otro horario",
  change_requested: "Pediste un cambio",
};

export const etiquetaRespuesta = (respuesta: string) => RESPUESTAS[respuesta] ?? respuesta;

const CIERRES: Record<string, string> = {
  not_open: "Tu entrega ya no se puede cambiar desde este enlace.",
  change_requested: "Ya enviaste una solicitud de cambio. Despacho la revisará y se comunicará contigo.",
  no_valid_notice: "Todavía no podemos recibir tu respuesta para esta entrega.",
  window_elapsed: "El plazo para confirmar o elegir otro horario ya venció.",
  confirmed: "Ya confirmaste esta entrega. ¡Gracias!",
  max_attempts: "Ya usaste todos tus cambios de horario.",
};

/**
 * Aviso para el cliente sobre lo que ya no puede hacer; null si no hay nada que avisar.
 * Si todavía puede pedir un cambio, se lo recuerda: es lo único que queda tras el cierre.
 */
export function avisoAutoservicio(autoservicio: Autoservicio): string | null {
  if (autoservicio.open) {
    return autoservicio.canReschedule
      ? null
      : "Para elegir otro horario necesitamos un correo registrado. Puedes solicitar un cambio.";
  }
  const motivo = autoservicio.closedReason ? CIERRES[autoservicio.closedReason] : null;
  if (!motivo) return null;
  return autoservicio.canRequestChange ? `${motivo} Si necesitas otra fecha, solicita un cambio.` : motivo;
}
