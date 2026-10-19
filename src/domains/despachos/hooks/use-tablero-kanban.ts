import { useQuery } from "@tanstack/react-query";

import type { FiltrosTableroKanban } from "../despachos.types";
import { obtenerTableroKanban } from "../services/tablero-kanban.service";
import { DISPATCHES_KANBAN_QUERY_KEY } from "./use-dispatch-events";

export function useTableroKanban(params: FiltrosTableroKanban, socketConnected: boolean) {
  return useQuery({
    queryKey: [...DISPATCHES_KANBAN_QUERY_KEY, params] as const,
    queryFn: ({ signal }) => obtenerTableroKanban(params, signal),
    staleTime: 0,
    refetchInterval: socketConnected ? false : 15_000,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  });
}
