import type { ApiError } from "@/shared/lib/api-error";
import type { DespachoDetalle } from "./despacho-detalle.types";

/*
 * Reprogramación del coordinador (ST-52.1, RF-A05): POST /dispatches/:id/reschedule y POST /dispatches/:id/return.
 * El back es quien decide; estas reglas solo preparan el formulario y explican sus respuestas.
 */

/** Estados desde los que se puede reprogramar: entrega fallida o, antes de salir, ya prometida. */
const REPROGRAMABLES = ["incident", "not_delivered", "scheduled", "assigned"];
/** Solo una entrega fallida puede volver al almacén. */
const DEVOLVIBLES = ["incident", "not_delivered"];

export const puedeReprogramar = (estado: string) => REPROGRAMABLES.includes(estado);
export const puedeDevolver = (estado: string) => DEVOLVIBLES.includes(estado);

/**
 * Intentos de entrega ya gastados, como los cuenta el back (D-30): cada entrada a `not_delivered` y cada
 * incidencia. Las reprogramaciones NO cuentan. El detalle no dice qué motivos de incidencia cuentan como
 * intento, así que es una estimación; el back vuelve a contar al guardar y manda si hay diferencia.
 */
export function contarIntentos(despacho: Pick<DespachoDetalle, "timeline" | "incidents">): number {
  let anterior: string | null = null;
  let noEntregas = 0;
  for (const evento of despacho.timeline) {
    if (!evento.status) continue;
    if (evento.status === "not_delivered" && anterior !== "not_delivered") noEntregas += 1;
    anterior = evento.status;
  }
  return noEntregas + despacho.incidents.length;
}

export interface EstadoIntentos {
  usados: number;
  limite: number;
  /** Número del intento que se programaría ahora («Intento n de N»). */
  siguiente: number;
  /** El próximo es el último permitido: se avisa antes de guardar. */
  ultimo: boolean;
  /** Ya no quedan intentos: el formulario se bloquea y solo queda devolver al almacén. */
  alcanzado: boolean;
}

export function estadoIntentos(usados: number, limite: number): EstadoIntentos {
  return { usados, limite, siguiente: Math.min(usados + 1, limite), ultimo: usados + 1 === limite, alcanzado: usados >= limite };
}

export interface Franja {
  /** HH:mm en hora de Bolivia. */
  inicio: string;
  fin: string;
}

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
};
const aHora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

/**
 * Franjas válidas de entrega: las ventanas de mañana y tarde cortadas cada `slot_duration_minutes`
 * (la misma regla con la que el back valida la franja).
 */
export function generarFranjas(valores: Record<string, string>): Franja[] {
  const duracion = Number(valores.slot_duration_minutes);
  if (!Number.isFinite(duracion) || duracion <= 0) return [];
  const franjas: Franja[] = [];
  for (const turno of ["morning", "afternoon"]) {
    const desde = aMinutos(valores[`${turno}_window_start`] ?? "");
    const hasta = aMinutos(valores[`${turno}_window_end`] ?? "");
    if (!Number.isFinite(desde) || !Number.isFinite(hasta)) continue;
    for (let inicio = desde; inicio + duracion <= hasta; inicio += duracion) {
      franjas.push({ inicio: aHora(inicio), fin: aHora(inicio + duracion) });
    }
  }
  return franjas;
}

/** Bolivia no tiene horario de verano: siempre UTC-4. */
const OFFSET_BOLIVIA = "-04:00";

/** Fecha (AAAA-MM-DD) + franja local → instantes UTC sin milisegundos, como los pide el back. */
export function ventanaUtc(fecha: string, franja: Franja): { windowStart: string; windowEnd: string } {
  const utc = (hora: string) => new Date(`${fecha}T${hora}:00${OFFSET_BOLIVIA}`).toISOString().replace(".000Z", "Z");
  return { windowStart: utc(franja.inicio), windowEnd: utc(franja.fin) };
}

/** Hoy en Bolivia (AAAA-MM-DD): la fecha pactada no puede ser anterior. */
export function hoyEnBolivia(ahora: number): string {
  return new Date(ahora - 4 * 60 * 60_000).toISOString().slice(0, 10);
}

const MENSAJES: Record<string, string> = {
  RESCHEDULE_ATTEMPTS_LIMIT_REACHED: "Se alcanzó el límite de intentos de entrega. Ya no se puede reprogramar: hay que devolverlo al almacén.",
  INVALID_RESCHEDULE_WINDOW: "La fecha o la franja no es válida: la fecha no puede ser anterior a hoy y la franja debe ser una de las configuradas.",
  RESCHEDULE_REASON_INVALID: "El motivo elegido ya no existe o está inactivo. Elige otro.",
  DISPATCH_STATUS_NOT_RESCHEDULABLE: "El despacho cambió de estado y ya no se puede reprogramar. Actualizamos la ficha.",
  DISPATCH_TYPE_NOT_SUPPORTED: "Los recojos se reprograman desde su propio flujo, no desde aquí.",
  DISPATCH_CHANGED_CONCURRENTLY: "El despacho cambió mientras lo editabas (lo movieron a otra ruta). Revisa la ficha y vuelve a intentar.",
  DISPATCH_RETURN_NOT_ALLOWED: "Solo un despacho con incidencia o no entregado puede volver al almacén.",
  DELIVERY_ATTEMPTS_NOT_EXHAUSTED: "Todavía le quedan intentos de entrega: reprográmalo en vez de devolverlo.",
  DISPATCH_NOT_FOUND: "El despacho ya no existe.",
};

/** Mensaje claro para los 400 y 409 del back; los de validación muestran el detalle que manda el back. */
export function mensajeErrorReprogramacion(error: ApiError): string {
  if (error.code && MENSAJES[error.code]) return MENSAJES[error.code];
  if (error.kind === "validation" && error.validationMessages.length > 0) return `Revisa los datos: ${error.validationMessages.join(" ")}`;
  if (error.kind === "forbidden") return "No tienes permisos para reprogramar despachos.";
  return `No se pudo completar la acción. ${error.message}`;
}

/** Tras estos errores lo que se ve ya no es vigente: hay que recargar la ficha. */
const RECARGAN = ["DISPATCH_STATUS_NOT_RESCHEDULABLE", "DISPATCH_CHANGED_CONCURRENTLY", "DISPATCH_RETURN_NOT_ALLOWED", "RESCHEDULE_ATTEMPTS_LIMIT_REACHED", "DELIVERY_ATTEMPTS_NOT_EXHAUSTED"];
export const requiereRecargar = (error: ApiError) => error.code !== undefined && RECARGAN.includes(error.code);
