/** Bolivia no tiene horario de verano: siempre UTC-4. */
const DESFASE_BOLIVIA_HORAS = 4;

/** Faltando menos de esto para el fin de la revisión, el reloj se marca en ámbar. */
export const MINUTOS_REVISION_PROXIMA = 60;

export type EstadoReloj = "sin-configurar" | "en-plazo" | "proximo" | "vencido" | "escalado";

export interface RelojRevision {
  estado: EstadoReloj;
  /** Texto corto para el detalle del lote. */
  texto: string;
  /** Fin de la revisión final (día anterior a la salida, D-1). */
  finRevision: Date | null;
  /** Escalamiento (día de salida, D): pasa a incidencia y se avisa al cliente del riesgo. */
  escalamiento: Date | null;
}

interface DatosReloj {
  /** `shift_date` del lote (AAAA-MM-DD): día de salida. */
  fechaTurno: string;
  /** Parámetro `final_review_end_time` (HH:mm), vacío si no está definido. */
  finRevision: string;
  /** Parámetro `final_review_escalation_time` (HH:mm), vacío si no está definido. */
  escalamiento: string;
}

/** Instante de una hora de Bolivia en el día de salida desplazado `dias` (−1 = día anterior). */
function instanteBolivia(fecha: string, horaMinuto: string, dias: number): Date | null {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const partes = /^(\d{1,2}):(\d{2})$/.exec(horaMinuto.trim());
  if (!anio || !mes || !dia || !partes) return null;
  return new Date(Date.UTC(anio, mes - 1, dia + dias, Number(partes[1]) + DESFASE_BOLIVIA_HORAS, Number(partes[2])));
}

/** «45 min», «2 h 10 min», «1 d 3 h». */
function duracion(ms: number): string {
  const minutos = Math.max(0, Math.floor(ms / 60_000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return minutos % 60 ? `${horas} h ${minutos % 60} min` : `${horas} h`;
  const dias = Math.floor(horas / 24);
  return horas % 24 ? `${dias} d ${horas % 24} h` : `${dias} d`;
}

const hora = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/La_Paz" });

/**
 * Reloj de revisión del lote definitivo (ST-51.1 / ST-51.4).
 * La revisión vence el día anterior a la salida (`final_review_end_time`, se alerta a coordinadores y
 * supervisor) y, si el lote sigue sin aprobar, el día de salida (`final_review_escalation_time`) pasa a incidencia.
 */
export function describirRelojRevision({ fechaTurno, finRevision, escalamiento }: DatosReloj, ahora: number): RelojRevision {
  const fin = instanteBolivia(fechaTurno, finRevision, -1);
  const escala = instanteBolivia(fechaTurno, escalamiento, 0);

  if (!fin || !escala) {
    return { estado: "sin-configurar", texto: "Horas de revisión sin definir en Parámetros operativos", finRevision: fin, escalamiento: escala };
  }
  if (ahora >= escala.getTime()) {
    return { estado: "escalado", texto: `Escalado: es incidencia desde las ${hora.format(escala)}`, finRevision: fin, escalamiento: escala };
  }
  if (ahora >= fin.getTime()) {
    return {
      estado: "vencido",
      texto: `Revisión vencida hace ${duracion(ahora - fin.getTime())} · se escala a las ${hora.format(escala)}`,
      finRevision: fin,
      escalamiento: escala,
    };
  }
  const falta = fin.getTime() - ahora;
  return {
    estado: falta <= MINUTOS_REVISION_PROXIMA * 60_000 ? "proximo" : "en-plazo",
    texto: `Quedan ${duracion(falta)} para aprobar (hasta las ${hora.format(fin)} del día anterior)`,
    finRevision: fin,
    escalamiento: escala,
  };
}
