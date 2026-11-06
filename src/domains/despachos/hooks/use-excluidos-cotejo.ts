import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/shared/lib/api-error";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { requiereRecargarCotejo } from "../excluidos-cotejo.reglas";
import { cancelarDespacho, marcarCotejoResuelto, obtenerExcluidosCotejo } from "../services/excluidos-cotejo.service";
import { despachoDetalleKeys } from "./use-despacho-detalle";
import { DISPATCHES_KANBAN_QUERY_KEY } from "./use-dispatch-events";

export const excluidosCotejoKeys = createQueryKeys("cotejo-exclusions");

/** Lista de paradas excluidas por cotejo. Se refresca al volver a la pestaña: las fotos vencen a los 5 min. */
export function useExcluidosCotejo() {
  return useQuery({
    queryKey: excluidosCotejoKeys.all,
    queryFn: ({ signal }) => obtenerExcluidosCotejo(signal),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

/** Todo lo que cambia cuando se cancela o se resuelve una parada. */
function useRecargarDespacho() {
  const queryClient = useQueryClient();
  return (id: number) => Promise.all([
    queryClient.invalidateQueries({ queryKey: excluidosCotejoKeys.all }),
    queryClient.invalidateQueries({ queryKey: despachoDetalleKeys.detail(id) }),
    queryClient.invalidateQueries({ queryKey: DISPATCHES_KANBAN_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: createQueryKeys("pending-orders").all }),
    queryClient.invalidateQueries({ queryKey: createQueryKeys("dispatch-history").all }),
  ]);
}

/** Cancelar un despacho (ficha 360° y panel de excluidos). Los errores los muestra el modal. */
export function useCancelarDespacho() {
  const recargar = useRecargarDespacho();
  return useMutation({
    mutationFn: ({ id, causal }: { id: number; causal: string }) => cancelarDespacho(id, causal),
    onSuccess: (hecho) => {
      toast.success(hecho.routeBatchClosed ? "Despacho cancelado. Era la última parada: el lote se cerró." : "Despacho cancelado.");
      void recargar(hecho.dispatchId);
    },
    onError: (error, { id }) => {
      if (requiereRecargarCotejo(parseApiError(error))) void recargar(id);
    },
  });
}

/** Marcar resuelto el cotejo de una parada (el bulto apareció). */
export function useResolverCotejo() {
  const recargar = useRecargarDespacho();
  return useMutation({
    mutationFn: ({ id, nota }: { id: number; nota: string | null }) => marcarCotejoResuelto(id, nota),
    onSuccess: (hecho) => {
      toast.success("Parada marcada como resuelta. Sigue asignada a su ruta.");
      void recargar(hecho.dispatchId);
    },
    onError: (error, { id }) => {
      if (requiereRecargarCotejo(parseApiError(error))) void recargar(id);
    },
  });
}
