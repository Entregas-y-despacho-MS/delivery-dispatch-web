const kilos = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 });
const metrosCubicos = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
const fechaTurno = new Intl.DateTimeFormat("es-BO", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** Desde este porcentaje la ocupación se marca como alta (ámbar). */
export const PORCENTAJE_OCUPACION_ALTA = 90;

export type NivelOcupacion = "normal" | "alta" | "excedida";

/** Nivel de la barra de ocupación: más de 100 % no entra en el vehículo. */
export function nivelOcupacion(porcentaje: number): NivelOcupacion {
  if (porcentaje > 100) return "excedida";
  if (porcentaje >= PORCENTAJE_OCUPACION_ALTA) return "alta";
  return "normal";
}

/** Porcentaje redondeado para mostrar, p. ej. «82 %». */
export const formatearPorcentaje = (valor: number) => `${Math.round(valor)} %`;

export const formatearKilos = (valor: number) => `${kilos.format(valor)} kg`;

export const formatearMetrosCubicos = (valor: number) => `${metrosCubicos.format(valor)} m³`;

/**
 * Fecha del turno del lote (`shift_date`, una fecha sin hora como «2026-10-17»), p. ej. «vie., 17/10».
 * Se formatea en UTC para que la zona horaria no la corra un día.
 */
export function formatearFechaTurno(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  return fechaTurno.format(new Date(Date.UTC(anio, mes - 1, dia)));
}

const hora = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/La_Paz" });

/** Franja propuesta en hora de Bolivia, p. ej. «08:00–10:00». */
export function formatearFranja(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Sin franja";
  const desde = hora.format(new Date(inicio));
  return fin ? `${desde}–${hora.format(new Date(fin))}` : desde;
}
