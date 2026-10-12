const ZONA_HORARIA = "America/La_Paz";

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
