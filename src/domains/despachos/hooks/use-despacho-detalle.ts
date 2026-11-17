import { useQuery } from "@tanstack/react-query";

import { parseApiError } from "@/shared/lib/api-error";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { obtenerDetalleDespacho } from "../services/despacho-detalle.service";

export const despachoDetalleKeys = createQueryKeys("dispatch-detail");

/**
 * Ficha 360° del despacho. Siempre se considera vieja (las URL de evidencias vencen) y no reintenta un 404.
 * Para renovar una URL vencida basta con `refetch()`.
 */
export function useDespachoDetalle(id: number | null) {
  return useQuery({
    queryKey: despachoDetalleKeys.detail(id ?? 0),
    queryFn: ({ signal }) => obtenerDetalleDespacho(id as number, signal),
    enabled: id !== null,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: (fallos, error) => fallos < 2 && parseApiError(error).retryable,
  });
}
