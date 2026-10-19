import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/shared/lib/api-error";
import { requiereRecargar } from "../reprogramacion.reglas";
import { devolverAlAlmacen, reprogramarDespacho, type ReprogramarPayload } from "../services/reprogramacion.service";
import { despachoDetalleKeys } from "./use-despacho-detalle";
import { DISPATCHES_KANBAN_QUERY_KEY } from "./use-dispatch-events";

/**
 * Reprogramar o devolver al almacén (ST-52.1). Nunca reintenta: ante un 409 recarga la ficha para que el
 * coordinador vea el estado vigente. Los errores los muestra el modal, no un toast.
 */
export function useReprogramacionDespacho(id: number) {
  const queryClient = useQueryClient();
  const recargar = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: despachoDetalleKeys.detail(id) }),
    queryClient.invalidateQueries({ queryKey: DISPATCHES_KANBAN_QUERY_KEY }),
  ]);
  const alFallar = (error: unknown) => {
    if (requiereRecargar(parseApiError(error))) void recargar();
  };

  const reprogramar = useMutation({
    mutationFn: (payload: ReprogramarPayload) => reprogramarDespacho(id, payload),
    onSuccess: (hecha) => {
      toast.success(`Despacho reprogramado. Lleva ${hecha.attemptsUsed} de ${hecha.attemptsLimit} intentos de entrega.`);
      void recargar();
    },
    onError: alFallar,
  });

  const devolver = useMutation({
    mutationFn: (notas: string | null) => devolverAlAlmacen(id, notas),
    onSuccess: () => {
      toast.success("Despacho devuelto al almacén.");
      void recargar();
    },
    onError: alFallar,
  });

  return { reprogramar, devolver };
}
