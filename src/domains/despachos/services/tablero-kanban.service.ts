import api from "@/shared/lib/axios";
import type { FiltrosTableroKanban, TableroKanban, TableroKanbanFiltrosCatalogo } from "../types/despachos.types";

/** Lectura de columnas y despachos operativos agrupados para la fecha seleccionada. */
export async function obtenerTableroKanban(params: FiltrosTableroKanban, signal?: AbortSignal): Promise<TableroKanban> {
  const { data } = await api.get<TableroKanban>("/dispatches/kanban", { params, signal, skipErrorToast: true });
  return data;
}

/** Lee el catálogo completo usado por los filtros, no solo los valores presentes hoy en el tablero. */
export async function obtenerFiltrosTableroKanban(signal?: AbortSignal): Promise<TableroKanbanFiltrosCatalogo> {
  const { data } = await api.get<TableroKanbanFiltrosCatalogo>("/dispatches/kanban/filters", { signal, skipErrorToast: true });
  return data;
}
