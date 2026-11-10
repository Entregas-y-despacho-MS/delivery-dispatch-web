import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DISPATCHES_KANBAN_QUERY_KEY } from "@/domains/despachos/hooks/use-dispatch-events";
import { programarRecojoProveedor, type PickupScheduleResponse } from "../services/procurement-pickups.service";

interface Callbacks {
  onSuccess?: (result: PickupScheduleResponse) => void;
  onError?: (error: unknown) => void;
}

/** Programa una compra y refresca el tablero operativo compartido. */
export function useProgramarRecojoProveedor(callbacks: Callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dispatchId }: { dispatchId: number }) =>
      programarRecojoProveedor(dispatchId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: DISPATCHES_KANBAN_QUERY_KEY });
      callbacks.onSuccess?.(result);
    },
    onError: callbacks.onError,
  });
}
