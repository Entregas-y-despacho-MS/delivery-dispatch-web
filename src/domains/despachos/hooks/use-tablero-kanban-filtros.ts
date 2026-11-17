import { useQuery } from "@tanstack/react-query";

import { obtenerFiltrosTableroKanban } from "../services/tablero-kanban.service";

export const TABLERO_KANBAN_FILTROS_QUERY_KEY = ["dispatches-kanban-filters"] as const;

export function useTableroKanbanFiltros() {
  return useQuery({
    queryKey: TABLERO_KANBAN_FILTROS_QUERY_KEY,
    queryFn: ({ signal }) => obtenerFiltrosTableroKanban(signal),
    staleTime: 5 * 60_000,
  });
}
