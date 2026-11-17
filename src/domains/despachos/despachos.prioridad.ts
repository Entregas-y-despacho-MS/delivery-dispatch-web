import type { MutationOptions, QueryClient } from "@tanstack/react-query";

import { parseApiError, type ApiError } from "@/shared/lib/api-error";
import type { ListResult } from "@/shared/lib/base.service";
import { createQueryKeys } from "@/shared/lib/query-keys";
import type { PedidoPendiente, PrioridadPedido } from "./types/despachos.types";

/** Estados en los que el back acepta cambiar la prioridad (ST-58.2). */
export const ESTADOS_CON_PRIORIDAD_EDITABLE: readonly string[] = ["pending", "in_planning", "scheduled"];

export const puedeCambiarPrioridad = (status: string) => ESTADOS_CON_PRIORIDAD_EDITABLE.includes(status);

export const nombrePrioridad = (prioridad: PrioridadPedido) => (prioridad === "urgent" ? "urgente" : "normal");

/** Mensaje para el coordinador cuando el back rechaza el cambio de prioridad. */
export function mensajeErrorPrioridad(error: ApiError, orderNumber: string): string {
  if (error.code === "DISPATCH_PRIORITY_NOT_CHANGEABLE") {
    return `No se pudo cambiar la prioridad de ${orderNumber}: ya no está pendiente ni en planificación. Actualizamos la bandeja.`;
  }
  if (error.kind === "not-found") return `El pedido ${orderNumber} ya no existe. Actualizamos la bandeja.`;
  if (error.kind === "forbidden") return "No tienes permisos para cambiar la prioridad de los pedidos.";
  return `No se pudo cambiar la prioridad de ${orderNumber}. ${error.message}`;
}

/** Misma caché que la bandeja (useCrud con el scope "pending-orders"). */
export const bandejaKeys = createQueryKeys("pending-orders");

export interface CambioPrioridad {
  pedido: Pick<PedidoPendiente, "id" | "orderNumber">;
  priority: PrioridadPedido;
}

interface OpcionesCambioPrioridad {
  queryClient: QueryClient;
  /** Llamada al back (PATCH /dispatches/:id/priority). */
  cambiar: (id: number, priority: PrioridadPedido) => Promise<{ priority: PrioridadPedido }>;
  avisar: { exito: (mensaje: string) => void; error: (mensaje: string) => void };
}

type Contexto = { anteriores: [readonly unknown[], ListResult<PedidoPendiente> | undefined][] };

/**
 * Lógica del cambio rápido de prioridad (ST-58.1), separada del hook para poder probarla:
 * el badge cambia al instante, si el back lo rechaza se revierte y se explica por qué,
 * y al final se recarga la bandeja para que el back la reordene (urgentes primero y por SLA).
 */
export function opcionesCambioPrioridad({ queryClient, cambiar, avisar }: OpcionesCambioPrioridad):
  MutationOptions<{ priority: PrioridadPedido }, unknown, CambioPrioridad, Contexto> {
  return {
    mutationFn: ({ pedido, priority }) => cambiar(pedido.id, priority),
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
      avisar.error(mensajeErrorPrioridad(parseApiError(error), pedido.orderNumber));
    },
    onSuccess: ({ priority }, { pedido }) => {
      avisar.exito(`${pedido.orderNumber} ahora es ${nombrePrioridad(priority)}.`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: bandejaKeys.all }),
  };
}
