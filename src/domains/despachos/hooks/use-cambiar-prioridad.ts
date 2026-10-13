import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/shared/lib/api-error";
import type { ListResult } from "@/shared/lib/base.service";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { mensajeErrorPrioridad, nombrePrioridad } from "../despachos.prioridad";
import type { PedidoPendiente, PrioridadPedido } from "../despachos.types";
import { cambiarPrioridadDespacho } from "../services/prioridad-despacho.service";

/** Misma caché que la bandeja (useCrud con el scope "pending-orders"). */
const bandejaKeys = createQueryKeys("pending-orders");

interface CambioPrioridad {
  pedido: Pick<PedidoPendiente, "id" | "orderNumber">;
  priority: PrioridadPedido;
}

/**
 * Cambio rápido de prioridad desde la bandeja (ST-58.1 parte 2):
 * el badge cambia al instante, luego se recarga la bandeja para que el back la reordene
 * (urgentes primero y por SLA) y, si el back lo rechaza, se revierte y se avisa.
 */
export function useCambiarPrioridad() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ pedido, priority }: CambioPrioridad) => cambiarPrioridadDespacho(pedido.id, priority),
    onMutate: async ({ pedido, priority }) => {
      await queryClient.cancelQueries({ queryKey: bandejaKeys.all });
      const anteriores = queryClient.getQueriesData<ListResult<PedidoPendiente>>({ queryKey: bandejaKeys.all });
      queryClient.setQueriesData<ListResult<PedidoPendiente>>({ queryKey: bandejaKeys.all }, (lista) => lista && {
        ...lista,
        items: lista.items.map((item) => (item.id === pedido.id ? { ...item, priority } : item)),
      });
      return { anteriores };
    },
    onError: (error, { pedido }, contexto) => {
      contexto?.anteriores.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(mensajeErrorPrioridad(parseApiError(error), pedido.orderNumber));
    },
    onSuccess: ({ priority }, { pedido }) => {
      toast.success(`${pedido.orderNumber} ahora es ${nombrePrioridad(priority)}.`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: bandejaKeys.all }),
  });

  return {
    cambiarPrioridad: (pedido: CambioPrioridad["pedido"], priority: PrioridadPedido) => mutation.mutate({ pedido, priority }),
    /** Id del pedido que se está guardando, para mostrar su badge ocupado. */
    cambiandoId: mutation.isPending ? mutation.variables?.pedido.id : undefined,
  };
}
