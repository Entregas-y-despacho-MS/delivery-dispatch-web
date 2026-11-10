import type { OrdenBandeja, PrioridadPedido, TurnoPedido } from "./types/despachos.types";

/** "all" o el id de la zona como texto. */
export type ZonaFilter = "all" | `${number}`;
export type TurnoFilter = "all" | TurnoPedido;
export type PrioridadFilter = "all" | PrioridadPedido;

export interface OrdenActual {
  sortBy: OrdenBandeja;
  order: "asc" | "desc";
}

/** Todo lo que el coordinador elige en la bandeja y queda guardado en la URL. */
export interface FiltrosBandeja {
  search: string;
  zona: ZonaFilter;
  turno: TurnoFilter;
  prioridad: PrioridadFilter;
  orden: OrdenActual | null;
  page: number;
}

export const FILTROS_BANDEJA_INICIALES: FiltrosBandeja = {
  search: "",
  zona: "all",
  turno: "all",
  prioridad: "all",
  orden: null,
  page: 1,
};

/** Nombres de los parámetros en la URL, p. ej. `?prioridad=urgent&zona=3&pagina=2`. */
const CLAVES = ["buscar", "zona", "turno", "prioridad", "orden", "dir", "pagina"] as const;

const TURNOS: readonly TurnoPedido[] = ["morning", "afternoon"];
const PRIORIDADES: readonly PrioridadPedido[] = ["urgent", "normal"];
const ORDENES: readonly OrdenBandeja[] = ["orderNumber", "recipient", "zone", "window", "weight", "priority"];

const incluye = <T extends string>(lista: readonly T[], valor: string | null): valor is T =>
  valor !== null && (lista as readonly string[]).includes(valor);

const enteroPositivo = (valor: string | null) => (valor && /^[1-9]\d{0,8}$/.test(valor) ? Number(valor) : null);

/**
 * Lee los filtros de la URL. Un valor inválido (editado a mano o de un link viejo)
 * se ignora y se usa el valor por defecto, para que la bandeja nunca mande basura al back.
 */
export function leerFiltrosBandeja(params: URLSearchParams): FiltrosBandeja {
  const zona = enteroPositivo(params.get("zona"));
  const turno = params.get("turno");
  const prioridad = params.get("prioridad");
  const sortBy = params.get("orden");
  return {
    search: (params.get("buscar") ?? "").slice(0, 100),
    zona: zona ? `${zona}` : "all",
    turno: incluye(TURNOS, turno) ? turno : "all",
    prioridad: incluye(PRIORIDADES, prioridad) ? prioridad : "all",
    orden: incluye(ORDENES, sortBy) ? { sortBy, order: params.get("dir") === "desc" ? "desc" : "asc" } : null,
    page: enteroPositivo(params.get("pagina")) ?? 1,
  };
}

/**
 * Escribe los filtros en la URL. Solo guarda lo que difiere del valor por defecto
 * (la bandeja sin filtros queda en `/despachos` limpio) y respeta los parámetros ajenos a la bandeja.
 */
export function escribirFiltrosBandeja(filtros: FiltrosBandeja, actuales = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(actuales);
  CLAVES.forEach((clave) => params.delete(clave));
  if (filtros.search) params.set("buscar", filtros.search);
  if (filtros.zona !== "all") params.set("zona", filtros.zona);
  if (filtros.turno !== "all") params.set("turno", filtros.turno);
  if (filtros.prioridad !== "all") params.set("prioridad", filtros.prioridad);
  if (filtros.orden) {
    params.set("orden", filtros.orden.sortBy);
    if (filtros.orden.order === "desc") params.set("dir", "desc");
  }
  if (filtros.page > 1) params.set("pagina", String(filtros.page));
  return params;
}
