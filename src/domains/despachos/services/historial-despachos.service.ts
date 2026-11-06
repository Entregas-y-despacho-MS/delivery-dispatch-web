import { isAxiosError } from "axios";

import api from "@/shared/lib/axios";
import { createCrudService } from "@/shared/lib/base.service";
import type { DespachoHistorial, HistorialParams, HistorialResponse } from "../historial.types";

/** Historial de despachos finalizados (ST-55.2). Solo lectura: { data, total, page, limit } → ListResult. */
export const historialDespachosService = createCrudService<
  DespachoHistorial,
  DespachoHistorial,
  never,
  never,
  HistorialParams,
  HistorialResponse
>({
  endpoint: "/dispatches/history",
  requestConfig: { skipErrorToast: true },
  mapListResponse: ({ data, total, page, limit }) => ({
    items: data,
    total,
    page,
    pageSize: limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  }),
});

const hoyBolivia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" });

/**
 * `filename="historial-despachos-2026-10-19.csv"` → el nombre. Si el navegador no deja leer el encabezado
 * (CORS no lo expone), se arma el mismo nombre con la fecha de hoy en Bolivia.
 */
export function nombreArchivoCsv(disposicion: string | undefined, ahora = new Date()): string {
  const nombre = disposicion?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)?.[1];
  return nombre ? decodeURIComponent(nombre) : `historial-despachos-${hoyBolivia.format(ahora)}.csv`;
}

/**
 * Descarga el CSV con los mismos filtros y orden de la pantalla (el back ignora page y limit).
 * Devuelve el nombre del archivo descargado.
 */
export async function exportarHistorialCsv(params: HistorialParams): Promise<string> {
  const respuesta = await api.get<Blob>("/dispatches/history/export", {
    params,
    responseType: "blob",
    skipErrorToast: true,
  }).catch(async (error: unknown) => {
    // Con responseType blob, el JSON del error llega como Blob: se lee para que parseApiError vea el código.
    if (isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        // No era JSON: queda el error HTTP tal cual.
      }
    }
    throw error;
  });
  const nombre = nombreArchivoCsv(respuesta.headers["content-disposition"] as string | undefined);
  const url = URL.createObjectURL(respuesta.data);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
  return nombre;
}
