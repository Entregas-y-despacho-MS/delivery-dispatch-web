import api from "@/shared/lib/axios";
import type { PrioridadPedido } from "../types/despachos.types";

/** Respuesta de PATCH /dispatches/:id/priority (ST-58.2). */
export interface PrioridadActualizada {
  id: number;
  priority: PrioridadPedido;
  /** Estado del despacho; el cambio de prioridad nunca lo modifica. */
  status: string;
}

/**
 * Cambia la prioridad de un despacho (ST-58.2, RF-A11). El back solo lo permite en
 * `pending`, `in_planning` y `scheduled`; en otro estado responde 409 DISPATCH_PRIORITY_NOT_CHANGEABLE.
 * Los errores los muestra el hook con un mensaje propio, por eso se omite el toast genérico.
 */
export async function cambiarPrioridadDespacho(id: number, priority: PrioridadPedido): Promise<PrioridadActualizada> {
  const { data } = await api.patch<PrioridadActualizada>(`/dispatches/${id}/priority`, { priority }, { skipErrorToast: true });
  return data;
}
