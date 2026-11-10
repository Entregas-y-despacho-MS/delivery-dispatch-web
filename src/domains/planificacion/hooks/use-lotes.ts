import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import type { LotesParams } from "../types/lotes.types";
import { lotesKeys } from "../planificacion.mutaciones";
import { listarLotes, obtenerLote } from "../services/lotes.service";

/** Lotes para la revisión. Comparte la caché que invalidan las acciones del lote. */
export function useLotes(params: LotesParams) {
  return useQuery({
    queryKey: lotesKeys.lists(params),
    queryFn: ({ signal }) => listarLotes(params, signal),
    placeholderData: keepPreviousData,
    ...QUERY_POLICIES.operational,
  });
}

/** Detalle de un lote; null = ninguno elegido. */
export function useLote(id: number | null) {
  return useQuery({
    queryKey: lotesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => obtenerLote(id as number, signal),
    enabled: id !== null,
    ...QUERY_POLICIES.operational,
  });
}
