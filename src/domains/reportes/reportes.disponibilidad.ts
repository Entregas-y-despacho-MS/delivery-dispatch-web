import type { ApiError } from "@/shared/lib/api-error";

/*
 * Dashboard 3 de flota (ST-303.2) sobre GET /fleet/availability (ST-303.1). Disponibilidad puntual al corte
 * (solo existe el estado actual: un corte pasado es N/D), mantenimiento en días calendario, carga en kg y m³
 * por separado y entregas/intentos por repartidor. `n` en todo.
 */

export type EstadoFlota = "active" | "maintenance" | "out_of_service";
export type MotivoND = "no_status_history" | "no_route_in_period" | "no_estimate" | "role_restricted";

export interface ResumenMantenimiento {
  count: number;
  calendarDays: number;
  overlapsDetected: boolean;
}

interface CifraCarga {
  used: number;
  capacity: number;
  /** used / capacity, sin tope: más de 1 es sobrecarga. */
  ratio: number;
}

export interface CargaVehiculo {
  kg: CifraCarga | null;
  m3: CifraCarga | null;
  routes: number;
  n: number;
  withoutWeight: number;
  withoutVolume: number;
  unavailableReason: MotivoND | null;
}

export interface VehiculoDisponibilidad {
  vehicleId: number;
  plate: string;
  fleetStatus: EstadoFlota | null;
  maintenance: ResumenMantenimiento;
  load: CargaVehiculo;
}

export interface RepartidorProductividad {
  driverId: number;
  driverName: string | null;
  deliveredCount: number;
  attemptCount: number;
}

export interface DisponibilidadFlota {
  cutoff: { date: string; kind: "current" | "past" };
  from: string;
  to: string;
  units: { time: "calendar_days"; load: ["kg", "m3"] };
  n: number;
  availability: {
    assignable: number | null;
    registered: number | null;
    inMaintenance: number | null;
    outOfService: number | null;
    unavailableReason: MotivoND | null;
  };
  maintenance: ResumenMantenimiento;
  vehicles: VehiculoDisponibilidad[];
  productivity: {
    detailRestricted: boolean;
    deliveredCount: number;
    attemptCount: number;
    drivers: RepartidorProductividad[];
  };
}

export type ParamsDisponibilidad = {
  cutoff: string;
  from: string;
  to: string;
  vehicleId?: number;
  driverId?: number;
  fleetStatus?: EstadoFlota;
  routine?: boolean;
};

export const ND = "N/D";

export const ESTADOS_FLOTA: Record<EstadoFlota, string> = {
  active: "Disponible",
  maintenance: "En mantenimiento",
  out_of_service: "Fuera de servicio",
};

export const MOTIVOS_ND: Record<MotivoND, string> = {
  no_status_history: "Solo se guarda el estado actual de la flota: para un corte pasado la disponibilidad no existe.",
  no_route_in_period: "El vehículo no tuvo rutas aprobadas en el período.",
  no_estimate: "Los despachos de sus rutas no tienen peso ni volumen estimado.",
  role_restricted: "Tu rol solo ve cifras agregadas.",
};

export type FiltroMantenimiento = "rutina" | "incidente" | null;

/** Filtros propios del panel (en la URL). El período usa el mismo `desde`/`hasta` del reporte de flota. */
export interface FiltrosDisponibilidad {
  corte: string;
  vehiculo: number | null;
  conductor: number | null;
  estado: EstadoFlota | null;
  mantenimiento: FiltroMantenimiento;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const entero = (valor: string | null) => (valor && /^\d+$/.test(valor) && Number(valor) > 0 ? Number(valor) : null);
export const hoyBolivia = (ahora = Date.now()) => new Date(ahora - 4 * 3_600_000).toISOString().slice(0, 10);

export function leerFiltrosDisponibilidad(url: URLSearchParams, ahora = Date.now()): FiltrosDisponibilidad {
  const corte = url.get("corte") ?? "";
  const estado = url.get("estadoFlota");
  const mantenimiento = url.get("mantenimiento");
  return {
    corte: FECHA.test(corte) ? corte : hoyBolivia(ahora),
    vehiculo: entero(url.get("vehiculo")),
    conductor: entero(url.get("conductor")),
    estado: estado && estado in ESTADOS_FLOTA ? (estado as EstadoFlota) : null,
    mantenimiento: mantenimiento === "rutina" || mantenimiento === "incidente" ? mantenimiento : null,
  };
}

export function escribirFiltrosDisponibilidad(f: FiltrosDisponibilidad, base: URLSearchParams): URLSearchParams {
  const url = new URLSearchParams(base);
  const poner = (clave: string, valor: string | number | null) => {
    if (valor === null || valor === "") url.delete(clave);
    else url.set(clave, String(valor));
  };
  poner("corte", f.corte);
  poner("vehiculo", f.vehiculo);
  poner("conductor", f.conductor);
  poner("estadoFlota", f.estado);
  poner("mantenimiento", f.mantenimiento);
  return url;
}

export const hayFiltrosDisponibilidad = (f: FiltrosDisponibilidad) => Boolean(f.vehiculo || f.conductor || f.estado || f.mantenimiento);

/** El filtro de conductor solo se manda si el rol puede ver el detalle: otro rol recibe 403. */
export function paramsDisponibilidad(f: FiltrosDisponibilidad, desde: string, hasta: string, puedeVerConductor: boolean): ParamsDisponibilidad {
  const params: ParamsDisponibilidad = { cutoff: f.corte, from: desde, to: hasta };
  if (f.vehiculo) params.vehicleId = f.vehiculo;
  if (f.conductor && puedeVerConductor) params.driverId = f.conductor;
  if (f.estado) params.fleetStatus = f.estado;
  if (f.mantenimiento) params.routine = f.mantenimiento === "rutina";
  return params;
}

/** «7 de 9 (78 %)»; N/D sin cifras o sin vehículos registrados. */
export function textoDisponibilidad(asignables: number | null, registrados: number | null): string {
  if (asignables === null || registrados === null || registrados === 0) return ND;
  return `${asignables} de ${registrados} (${Math.round((asignables / registrados) * 100)} %)`;
}

const numero = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 });

/** «820 / 1000 kg (82 %)»; con despachos sin estimado, es una cota inferior («≥»). */
export function textoCarga(cifra: CifraCarga | null, unidad: "kg" | "m³", sinEstimado: number): string {
  if (!cifra) return ND;
  const prefijo = sinEstimado > 0 ? "≥ " : "";
  return `${prefijo}${numero.format(cifra.used)} / ${numero.format(cifra.capacity)} ${unidad} (${Math.round(cifra.ratio * 100)} %)`;
}

export const textoDias = (dias: number) => (dias === 1 ? "1 día calendario" : `${numero.format(dias)} días calendario`);

/** Tasa de entrega sobre intentos; N/D sin intentos. */
export const tasaEntrega = (entregados: number, intentos: number) => (intentos > 0 ? `${Math.round((entregados / intentos) * 100)} %` : ND);

export function mensajeErrorDisponibilidad(error: ApiError): string {
  if (error.code === "DRIVER_DETAIL_FORBIDDEN") return "Tu rol solo ve cifras agregadas de los repartidores: quitamos el filtro de conductor.";
  if (error.status === 403) return "No tienes permiso para ver la disponibilidad de la flota.";
  if (error.kind === "validation") return "Revisa el corte y el período: el período no puede pasar de 366 días.";
  if (error.kind === "network") return "No pudimos conectarnos con el servidor. Revisa tu conexión.";
  return "No pudimos cargar la disponibilidad de la flota. Intenta de nuevo.";
}
