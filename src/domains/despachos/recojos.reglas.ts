import { parseApiError } from "@/shared/lib/api-error";
import type { OrigenRecojo, RecojoListParams } from "./recojos.types";

export const RECOJOS_POR_PAGINA = 10;

/** Estados por los que pasa un recojo, en orden, para el filtro. */
export const ESTADOS_RECOJO = [
  "pickup_scheduled",
  "address_review",
  "in_planning",
  "scheduled",
  "assigned",
  "picked_up_in_transit",
  "returned_to_warehouse",
  "cancelled",
] as const;

/** El coordinador solo puede anular antes de que salga la ruta (ST-81.2). */
const ESTADOS_ANULABLES = new Set(["pickup_scheduled", "address_review", "in_planning"]);
export const sePuedeAnular = (estado: string) => ESTADOS_ANULABLES.has(estado);

export const ETIQUETA_ORIGEN: Record<OrigenRecojo, string> = { manual: "Manual", rma: "RMA" };

export const MAX_MOTIVO_ANULACION = 500;

/** Filtros del listado (ST-81.1). Viven en la URL. */
export interface FiltrosRecojos {
  estado: string | null;
  origen: OrigenRecojo | null;
  /** AAAA-MM-DD o vacío. */
  desde: string;
  hasta: string;
  pagina: number;
}

const esFecha = (valor: string | null): valor is string => !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor));

export function leerFiltrosRecojos(params: URLSearchParams): FiltrosRecojos {
  const estado = params.get("estado");
  const origen = params.get("origen");
  const pagina = Number(params.get("pagina"));
  return {
    estado: (ESTADOS_RECOJO as readonly string[]).includes(estado ?? "") ? estado : null,
    origen: origen === "manual" || origen === "rma" ? origen : null,
    desde: esFecha(params.get("desde")) ? params.get("desde")! : "",
    hasta: esFecha(params.get("hasta")) ? params.get("hasta")! : "",
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : 1,
  };
}

/** Los filtros vacíos (y la página 1) no se escriben en la URL. */
export function escribirFiltrosRecojos(filtros: FiltrosRecojos, actuales: URLSearchParams): URLSearchParams {
  const url = new URLSearchParams(actuales);
  const poner = (clave: string, valor: string | number | null) => {
    if (valor === null || valor === "") url.delete(clave);
    else url.set(clave, String(valor));
  };
  poner("estado", filtros.estado);
  poner("origen", filtros.origen);
  poner("desde", filtros.desde);
  poner("hasta", filtros.hasta);
  poner("pagina", filtros.pagina > 1 ? filtros.pagina : null);
  return url;
}

/** El back responde 400 INVALID_PICKUP_DATE_RANGE si `to` es antes que `from`: no se consulta. */
export const rangoRecojosInvertido = ({ desde, hasta }: Pick<FiltrosRecojos, "desde" | "hasta">) =>
  !!desde && !!hasta && desde > hasta;

export const hayFiltrosRecojos = (f: FiltrosRecojos) => f.estado !== null || f.origen !== null || !!f.desde || !!f.hasta;

export function paramsRecojos(filtros: FiltrosRecojos): RecojoListParams {
  return {
    page: filtros.pagina,
    limit: RECOJOS_POR_PAGINA,
    ...(filtros.estado ? { status: filtros.estado } : {}),
    ...(filtros.origen ? { origin: filtros.origen } : {}),
    ...(filtros.desde ? { from: filtros.desde } : {}),
    ...(filtros.hasta ? { to: filtros.hasta } : {}),
  };
}

/** Campos del formulario que el back puede rechazar por su cuenta. */
export type CampoRecojo = "warehouseCode" | "preferredPickupDate";

export interface ErrorRecojo {
  mensaje: string;
  /** Si el error es de un campo, se muestra debajo de él. */
  campo?: CampoRecojo;
  /** El recojo ya cambió de estado: hay que recargar la lista. */
  recargar?: boolean;
}

/** Traduce los errores de crear y anular. Se decide por `status` y `code`, nunca por el texto. */
export function errorRecojo(error: unknown): ErrorRecojo {
  const apiError = parseApiError(error);
  switch (apiError.code) {
    case "WAREHOUSE_NOT_AVAILABLE":
      return { campo: "warehouseCode", mensaje: "Ese almacén no existe o ya no está activo. Elige otro." };
    case "PICKUP_DATE_IN_PAST":
      return { campo: "preferredPickupDate", mensaje: "La fecha no puede ser anterior a hoy." };
    case "DISPATCH_CANCEL_NOT_ALLOWED":
      return { mensaje: "Este recojo ya no se puede anular: la ruta ya salió o cambió de estado. Actualizamos la lista.", recargar: true };
    case "DISPATCH_CHANGED_CONCURRENTLY":
      return { mensaje: "El recojo cambió mientras lo anulabas. Revisa su estado y vuelve a intentar.", recargar: true };
    case "DISPATCH_TYPE_NOT_SUPPORTED":
      return { mensaje: "Ese despacho no es un recojo de devolución." };
    case "DISPATCH_NOT_FOUND":
    case "PICKUP_ORDER_NOT_FOUND":
      return { mensaje: "Este recojo ya no existe.", recargar: true };
  }
  if (apiError.status === 403) return { mensaje: "Solo el coordinador puede registrar o anular recojos." };
  if (apiError.kind === "validation") return { mensaje: apiError.message };
  return { mensaje: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
}
