/** A partir de este porcentaje la carga se marca como «cerca del límite». */
export const PORCENTAJE_CAPACIDAD_ALTA = 90;

export type EstadoCapacidad = "normal" | "alta" | "excedida" | "sin-capacidad";

export type MedidaCapacidad = "peso" | "volumen";

export interface CargaVehiculo {
  /** Total de los pedidos del lote. */
  usado: number;
  /** Capacidad del vehículo; null si el vehículo no la tiene registrada. */
  capacidad: number | null;
}

export interface Capacidad {
  medida: MedidaCapacidad;
  usado: number;
  capacidad: number | null;
  /** Porcentaje usado, redondeado a entero; null sin capacidad registrada. */
  porcentaje: number | null;
  /** Cuánto supera la capacidad (0 si no la supera), en la unidad de la medida. */
  exceso: number;
  estado: EstadoCapacidad;
}

/** Redondeo para comparar y mostrar sin ruido de coma flotante (0,1 + 0,2 kg). */
const redondear = (valor: number, decimales: number) => Math.round(valor * 10 ** decimales) / 10 ** decimales;
const DECIMALES: Record<MedidaCapacidad, number> = { peso: 2, volumen: 3 };

/**
 * Carga del lote frente a la capacidad del vehículo (ST-51.1): porcentaje, exceso exacto y estado.
 * Pasar del 100 % en peso o en volumen bloquea la aprobación.
 */
export function calcularCapacidad(medida: MedidaCapacidad, { usado, capacidad }: CargaVehiculo): Capacidad {
  const usadoRedondeado = redondear(usado, DECIMALES[medida]);
  if (capacidad === null || capacidad <= 0) {
    return { medida, usado: usadoRedondeado, capacidad: null, porcentaje: null, exceso: 0, estado: "sin-capacidad" };
  }
  const exceso = Math.max(0, redondear(usado - capacidad, DECIMALES[medida]));
  const porcentaje = Math.round((usado / capacidad) * 100);
  const estado: EstadoCapacidad = exceso > 0 ? "excedida" : porcentaje >= PORCENTAJE_CAPACIDAD_ALTA ? "alta" : "normal";
  return { medida, usado: usadoRedondeado, capacidad, porcentaje, exceso, estado };
}

export interface ResultadoAprobacion {
  permitida: boolean;
  /** Motivos para el coordinador, p. ej. «El peso supera la capacidad del vehículo por 45 kg». */
  motivos: string[];
}

const kilos = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
const metrosCubicos = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 });

/** Valor con su unidad: «845 kg», «4,2 m³». */
export function formatearMedida(medida: MedidaCapacidad, valor: number): string {
  return medida === "peso" ? `${kilos.format(valor)} kg` : `${metrosCubicos.format(valor)} m³`;
}

/**
 * ¿Se puede aprobar el lote con este vehículo? No, si el peso o el volumen superan la capacidad
 * (se dice el exceso exacto) o si el vehículo no tiene capacidad registrada para comparar.
 */
export function puedeAprobarPorCapacidad(capacidades: Capacidad[]): ResultadoAprobacion {
  const motivos = capacidades.flatMap((c) => {
    const nombre = c.medida === "peso" ? "El peso" : "El volumen";
    if (c.estado === "excedida") return [`${nombre} supera la capacidad del vehículo por ${formatearMedida(c.medida, c.exceso)}.`];
    if (c.estado === "sin-capacidad") return [`El vehículo no tiene registrada su capacidad de ${c.medida}.`];
    return [];
  });
  return { permitida: motivos.length === 0, motivos };
}
