import { fechaValida } from "./historial.url";
import type { SolicitudesCambioParams } from "./types/solicitudes-cambio.types";

export const FILAS_SOLICITUDES = 10;

/** Filtros de la bandeja de solicitudes; viven en la URL. */
export interface FiltrosSolicitudes {
  buscar: string;
  zona: "all" | `${number}`;
  fecha: string;
  pagina: number;
}

export const FILTROS_SOLICITUDES_INICIALES: FiltrosSolicitudes = { buscar: "", zona: "all", fecha: "", pagina: 1 };

const CLAVES = ["buscar", "zona", "fecha", "pagina"] as const;
const enteroPositivo = (valor: string | null) => (valor && /^[1-9]\d{0,8}$/.test(valor) ? Number(valor) : null);

/** Lee la URL; lo inválido se ignora. */
export function leerFiltrosSolicitudes(params: URLSearchParams): FiltrosSolicitudes {
  const zona = enteroPositivo(params.get("zona"));
  const fecha = params.get("fecha");
  return {
    buscar: (params.get("buscar") ?? "").slice(0, 100),
    zona: zona ? `${zona}` : "all",
    fecha: fechaValida(fecha) ? fecha : "",
    pagina: enteroPositivo(params.get("pagina")) ?? 1,
  };
}

/** Escribe en la URL solo lo que difiere del valor por defecto y respeta los parámetros ajenos. */
export function escribirFiltrosSolicitudes(filtros: FiltrosSolicitudes, actuales = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(actuales);
  CLAVES.forEach((clave) => params.delete(clave));
  if (filtros.buscar) params.set("buscar", filtros.buscar);
  if (filtros.zona !== "all") params.set("zona", filtros.zona);
  if (filtros.fecha) params.set("fecha", filtros.fecha);
  if (filtros.pagina > 1) params.set("pagina", String(filtros.pagina));
  return params;
}

export function paramsSolicitudes(filtros: FiltrosSolicitudes): SolicitudesCambioParams {
  return {
    page: filtros.pagina,
    limit: FILAS_SOLICITUDES,
    delivery_zone_id: filtros.zona === "all" ? undefined : Number(filtros.zona),
    date: filtros.fecha || undefined,
    search: filtros.buscar || undefined,
  };
}
