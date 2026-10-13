import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { opcionesCambioPrioridad, type CambioPrioridad } from "../despachos.prioridad";
import type { PrioridadPedido } from "../despachos.types";
import { cambiarPrioridadDespacho } from "../services/prioridad-despacho.service";

/** Cambio rápido de prioridad desde la bandeja (ST-58.1). La lógica vive en `opcionesCambioPrioridad`. */
export function useCambiarPrioridad() {
  const queryClient = useQueryClient();
  const mutation = useMutation(opcionesCambioPrioridad({
    queryClient,
    cambiar: cambiarPrioridadDespacho,
    avisar: { exito: toast.success, error: toast.error },
  }));

  return {
    cambiarPrioridad: (pedido: CambioPrioridad["pedido"], priority: PrioridadPedido) => mutation.mutate({ pedido, priority }),
    /** Id del pedido que se está guardando, para mostrar su badge ocupado. */
    cambiandoId: mutation.isPending ? mutation.variables?.pedido.id : undefined,
  };
}
