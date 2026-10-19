import api from "@/shared/lib/axios";
import type { FiltrosTableroKanban, TableroKanban } from "../despachos.types";

/** Lectura de columnas y despachos operativos agrupados para la fecha seleccionada. */
export async function obtenerTableroKanban(params: FiltrosTableroKanban, signal?: AbortSignal): Promise<TableroKanban> {
  const { data } = await api.get<TableroKanban>("/dispatches/kanban", { params, signal, skipErrorToast: true });
  return data;
}
