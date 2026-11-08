import { parseApiError } from "@/shared/lib/api-error";
import type { EstadoMantenimiento, MantenimientoListParams, TipoMantenimiento } from "./flota.types";

export const ESTADOS_MANTENIMIENTO: readonly EstadoMantenimiento[] = ["pending", "in_progress", "completed"];

export const ETIQUETA_ESTADO_MANTENIMIENTO: Record<EstadoMantenimiento, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completado",
};

export const ETIQUETA_TIPO_MANTENIMIENTO: Record<TipoMantenimiento, string> = {
  preventive: "Preventivo",
  corrective: "Correctivo",
};

export const MANTENIMIENTOS_POR_PAGINA = 10;

/** El único paso que admite el back desde cada estado; null si ya está cerrado. */
export function siguienteEstado(estado: EstadoMantenimiento): Exclude<EstadoMantenimiento, "pending"> | null {
  if (estado === "pending") return "in_progress";
  if (estado === "in_progress") return "completed";
  return null;
}

/** Filtros del historial (ST-64.2). Viven en la URL para poder volver o compartir el link. */
export interface FiltrosMantenimiento {
  vehiculoId: number | null;
  estado: EstadoMantenimiento | null;
  /** YYYY-MM-DD o vacío. */
  desde: string;
  hasta: string;
  pagina: number;
}

const esFecha = (valor: string | null): valor is string => !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor));
const enteroPositivo = (valor: string | null) => (valor && /^\d+$/.test(valor) && Number(valor) > 0 ? Number(valor) : null);

/** Lee los filtros de la URL; lo inválido se ignora (sin filtro). */
export function leerFiltrosMantenimiento(params: URLSearchParams): FiltrosMantenimiento {
  const estado = params.get("estado");
  return {
    vehiculoId: enteroPositivo(params.get("vehiculo")),
    estado: ESTADOS_MANTENIMIENTO.includes(estado as EstadoMantenimiento) ? (estado as EstadoMantenimiento) : null,
    desde: esFecha(params.get("desde")) ? params.get("desde")! : "",
    hasta: esFecha(params.get("hasta")) ? params.get("hasta")! : "",
    pagina: enteroPositivo(params.get("pagina")) ?? 1,
  };
}

/** Escribe los filtros en la URL; los vacíos (y la página 1) no se escriben. */
export function escribirFiltrosMantenimiento(filtros: FiltrosMantenimiento, actuales: URLSearchParams): URLSearchParams {
  const siguiente = new URLSearchParams(actuales);
  const poner = (clave: string, valor: string | number | null) => {
    if (valor === null || valor === "") siguiente.delete(clave);
    else siguiente.set(clave, String(valor));
  };
  poner("vehiculo", filtros.vehiculoId);
  poner("estado", filtros.estado);
  poner("desde", filtros.desde);
  poner("hasta", filtros.hasta);
  poner("pagina", filtros.pagina > 1 ? filtros.pagina : null);
  return siguiente;
}

/** El back responde 400 INVALID_MAINTENANCE_DATE_RANGE si `to` es antes que `from`: no se consulta. */
export const rangoInvertido = ({ desde, hasta }: Pick<FiltrosMantenimiento, "desde" | "hasta">) =>
  !!desde && !!hasta && desde > hasta;

export function paramsMantenimiento(filtros: FiltrosMantenimiento): MantenimientoListParams {
  return {
    page: filtros.pagina,
    limit: MANTENIMIENTOS_POR_PAGINA,
    ...(filtros.vehiculoId ? { vehicleId: filtros.vehiculoId } : {}),
    ...(filtros.estado ? { status: filtros.estado } : {}),
    ...(filtros.desde ? { from: filtros.desde } : {}),
    ...(filtros.hasta ? { to: filtros.hasta } : {}),
  };
}

export interface ErrorMantenimiento {
  mensaje: string;
  /** Lotes que impiden pasar el vehículo a mantenimiento (409 VEHICLE_HAS_ACTIVE_BATCHES). */
  lotes?: { id: number; shiftDate: string }[];
}

/** Traduce los errores del POST y del PATCH. Se decide por `status` y `code`, nunca por el texto. */
export function errorMantenimiento(error: unknown): ErrorMantenimiento {
  const apiError = parseApiError(error);
  switch (apiError.code) {
    case "VEHICLE_HAS_ACTIVE_BATCHES":
      return {
        mensaje: "No se puede registrar: el vehículo tiene lotes confirmados o en ruta. Cambia el vehículo de esos lotes primero.",
        lotes: apiError.details?.batches ?? [],
      };
    case "INVALID_MAINTENANCE_TRANSITION":
      return { mensaje: "Este mantenimiento ya cambió de estado. Actualizamos la lista; revisa su estado actual." };
    case "VEHICLE_MAINTENANCE_NOT_FOUND":
      return { mensaje: "Este mantenimiento ya no existe." };
    case "VEHICLE_NOT_FOUND":
      return { mensaje: "El vehículo ya no existe o fue dado de baja." };
    case "VEHICLE_INCIDENT_TYPE_NOT_FOUND":
      return { mensaje: "El tipo de incidente ya no existe en el catálogo. Elige otro." };
  }
  if (apiError.status === 403) return { mensaje: "Solo el supervisor o el coordinador pueden gestionar mantenimientos." };
  if (apiError.kind === "validation") return { mensaje: apiError.message };
  return { mensaje: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
}
