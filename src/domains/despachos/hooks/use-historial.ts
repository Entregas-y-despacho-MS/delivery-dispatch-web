import { useQuery } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { historialService } from "../services/historial.service";
import type { HistorialParams } from "../historial.types";

export const HISTORIAL_QUERY_KEY = ["dispatches-history"] as const;
export function useHistorial(params: HistorialParams) {
  return useQuery({ queryKey: [...HISTORIAL_QUERY_KEY, params], queryFn: ({ signal }) => historialService.list(params, signal), ...QUERY_POLICIES.operational });
}
