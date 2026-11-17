const ZONA_HORARIA = "America/La_Paz";

const fechaHora = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA_HORARIA });
const hora = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA_HORARIA });
const kilos = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
const metrosCubicos = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 });

/** Franja pactada en hora de Bolivia, p. ej. «08:00–10:00». */
export function formatearFranja(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Sin franja";
  const desde = hora.format(new Date(inicio));
  return fin ? `${desde}–${hora.format(new Date(fin))}` : desde;
}

/** Peso en kg con hasta 2 decimales, formato boliviano (12,5). */
export const formatearKilos = (valor: number) => kilos.format(valor);

/** Volumen en m³ con hasta 3 decimales. */
export const formatearMetrosCubicos = (valor: number) => metrosCubicos.format(valor);

/** Faltando menos de esto, el vencimiento del SLA se marca como próximo. */
export const MINUTOS_SLA_PROXIMO = 120;

export type EstadoSla = "sin-sla" | "vencido" | "proximo" | "a-tiempo";

export interface VencimientoSla {
  estado: EstadoSla;
  /** Texto corto para la tabla, p. ej. «Vence en 45 min» o «Vencido hace 2 h». */
  texto: string;
  /** Fecha y hora exactas en hora de Bolivia, p. ej. «12/10 15:30». */
  fecha: string | null;
}

/**
 * Duración legible y corta: «45 min», «1 h 10 min», «21 h», «1 d 3 h».
 * Los minutos solo importan cerca del vencimiento (menos de 2 h); después se omiten
 * para que el texto no ensanche la tabla.
 */
function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    const resto = minutos % 60;
    return resto && minutos < MINUTOS_SLA_PROXIMO ? `${horas} h ${resto} min` : `${horas} h`;
  }
  const dias = Math.floor(horas / 24);
  const restoHoras = horas % 24;
  return restoHoras ? `${dias} d ${restoHoras} h` : `${dias} d`;
}

/** Cuánto falta (o cuánto pasó) para el vencimiento del SLA de un pedido (`slaDueAt` de ST-48.2). */
export function describirVencimientoSla(slaDueAt: string | null, ahora: number): VencimientoSla {
  if (!slaDueAt) return { estado: "sin-sla", texto: "Sin SLA", fecha: null };
  const vence = new Date(slaDueAt);
  const minutos = Math.round((vence.getTime() - ahora) / 60_000);
  const fecha = fechaHora.format(vence);
  if (minutos <= 0) return { estado: "vencido", texto: minutos === 0 ? "Vence ahora" : `Vencido hace ${formatearDuracion(-minutos)}`, fecha };
  return {
    estado: minutos <= MINUTOS_SLA_PROXIMO ? "proximo" : "a-tiempo",
    texto: `Vence en ${formatearDuracion(minutos)}`,
    fecha,
  };
}
