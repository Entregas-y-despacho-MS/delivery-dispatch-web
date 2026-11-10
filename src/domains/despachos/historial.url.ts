import { ESTADOS_FINALES, ORDENES_HISTORIAL, type EstadoFinal, type HistorialParams, type OrdenHistorial } from "./types/historial.types";

export const FILAS_HISTORIAL = [10, 20, 50] as const;

/** Lo que el coordinador elige en el historial; vive en la URL para recargar o compartir el link. */
export interface FiltrosHistorial {
  buscar: string;
  desde: string;
  hasta: string;
  conductor: "all" | `${number}`;
  placa: string;
  estado: "all" | EstadoFinal;
  orden: OrdenHistorial;
  dir: "asc" | "desc";
  pagina: number;
  filas: number;
}

export const FILTROS_HISTORIAL_INICIALES: FiltrosHistorial = {
  buscar: "",
  desde: "",
  hasta: "",
  conductor: "all",
  placa: "",
  estado: "all",
  orden: "closedAt",
  dir: "desc",
  pagina: 1,
  filas: 10,
};

const CLAVES = ["buscar", "desde", "hasta", "conductor", "placa", "estado", "orden", "dir", "pagina", "filas"] as const;

const incluye = <T extends string>(lista: readonly T[], valor: string | null): valor is T =>
  valor !== null && (lista as readonly string[]).includes(valor);
const enteroPositivo = (valor: string | null) => (valor && /^[1-9]\d{0,8}$/.test(valor) ? Number(valor) : null);

/** Fecha real en YYYY-MM-DD (rechaza 2026-02-31). */
export function fechaValida(valor: string | null): valor is string {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

/** Lee la URL; lo inválido (link viejo o editado a mano) se ignora y queda el valor por defecto. */
export function leerFiltrosHistorial(params: URLSearchParams): FiltrosHistorial {
  const conductor = enteroPositivo(params.get("conductor"));
  const estado = params.get("estado");
  const orden = params.get("orden");
  const filas = enteroPositivo(params.get("filas"));
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  const ordenValido = incluye(ORDENES_HISTORIAL, orden);
  return {
    buscar: (params.get("buscar") ?? "").slice(0, 100),
    desde: fechaValida(desde) ? desde : "",
    hasta: fechaValida(hasta) ? hasta : "",
    conductor: conductor ? `${conductor}` : "all",
    placa: (params.get("placa") ?? "").slice(0, 15),
    estado: incluye(ESTADOS_FINALES, estado) ? estado : "all",
    orden: ordenValido ? orden : "closedAt",
    // Sin orden en la URL, lo más reciente primero (desc), igual que el back.
    dir: ordenValido ? (params.get("dir") === "desc" ? "desc" : "asc") : "desc",
    pagina: enteroPositivo(params.get("pagina")) ?? 1,
    filas: filas && (FILAS_HISTORIAL as readonly number[]).includes(filas) ? filas : 10,
  };
}

/** Escribe en la URL solo lo que difiere del valor por defecto y respeta los parámetros ajenos. */
export function escribirFiltrosHistorial(filtros: FiltrosHistorial, actuales = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(actuales);
  CLAVES.forEach((clave) => params.delete(clave));
  if (filtros.buscar) params.set("buscar", filtros.buscar);
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  if (filtros.conductor !== "all") params.set("conductor", filtros.conductor);
  if (filtros.placa) params.set("placa", filtros.placa);
  if (filtros.estado !== "all") params.set("estado", filtros.estado);
  const ordenPorDefecto = filtros.orden === "closedAt" && filtros.dir === "desc";
  if (!ordenPorDefecto) {
    params.set("orden", filtros.orden);
    if (filtros.dir === "desc") params.set("dir", "desc");
  }
  if (filtros.pagina > 1) params.set("pagina", String(filtros.pagina));
  if (filtros.filas !== 10) params.set("filas", String(filtros.filas));
  return params;
}

/** El rango está al revés: el back respondería 400 INVALID_DATE_RANGE, así que ni se pide. */
export const rangoInvertido = (filtros: Pick<FiltrosHistorial, "desde" | "hasta">) =>
  Boolean(filtros.desde && filtros.hasta && filtros.desde > filtros.hasta);

/** Los filtros como los entiende GET /dispatches/history (y su export). */
export function paramsHistorial(filtros: FiltrosHistorial): HistorialParams {
  return {
    page: filtros.pagina,
    limit: filtros.filas,
    from: filtros.desde || undefined,
    to: filtros.hasta || undefined,
    driverId: filtros.conductor === "all" ? undefined : Number(filtros.conductor),
    plate: filtros.placa || undefined,
    status: filtros.estado === "all" ? undefined : filtros.estado,
    search: filtros.buscar || undefined,
    sortBy: filtros.orden,
    order: filtros.dir,
  };
}
