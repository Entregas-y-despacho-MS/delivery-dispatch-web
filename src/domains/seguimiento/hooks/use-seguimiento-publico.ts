import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { parseApiError } from "@/shared/lib/api-error";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { intervaloRefresco } from "../seguimiento.en-vivo";
import type { CalificacionEntrega, CalificarEntregaInput, SeguimientoPublico } from "../types/seguimiento.types";
import {
  calificarEntrega,
  confirmarEntrega,
  obtenerSeguimiento,
  solicitarCambio,
} from "../services/tracking-publico.service";

export const seguimientoKeys = createQueryKeys("public-tracking");

/** Ni 404 (enlace inválido) ni 429 (límite por IP) mejoran reintentando solos. */
const reintentar = (fallos: number, error: unknown) => fallos < 2 && parseApiError(error).retryable;

/**
 * Pedido del enlace. Se recarga al volver a la pestaña: el estado cambia sin que el cliente haga nada.
 * Mientras va en camino se recarga cada 30 s (ST-40.2), solo con la pestaña visible.
 */
export function useSeguimientoPublico(token: string) {
  return useQuery({
    queryKey: seguimientoKeys.detail(token),
    queryFn: ({ signal }) => obtenerSeguimiento(token, signal),
    retry: reintentar,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => intervaloRefresco(query.state.data),
    refetchIntervalInBackground: false,
  });
}

/** Confirmar o pedir un cambio devuelven el pedido actualizado: se pone directo en la caché. */
export function useRespuestaCliente(token: string) {
  const queryClient = useQueryClient();
  const guardar = (pedido: SeguimientoPublico) => queryClient.setQueryData(seguimientoKeys.detail(token), pedido);
  const recargar = () => queryClient.invalidateQueries({ queryKey: seguimientoKeys.detail(token) });

  const confirmar = useMutation({ mutationFn: () => confirmarEntrega(token), onSuccess: guardar, onError: recargar });
  const cambio = useMutation({ mutationFn: (detalle: string) => solicitarCambio(token, detalle), onSuccess: guardar, onError: recargar });

  // El POST devuelve solo la calificación: se agrega al pedido en caché y ya no se puede volver a calificar.
  const ponerCalificacion = (calificacion: CalificacionEntrega) =>
    queryClient.setQueryData<SeguimientoPublico>(seguimientoKeys.detail(token), (pedido) =>
      pedido ? { ...pedido, rating: calificacion, canRate: false } : pedido);
  // Con un 409 (ya calificada o aún no entregada) se recarga: la vista muestra el estado real.
  const calificar = useMutation({
    mutationFn: (input: CalificarEntregaInput) => calificarEntrega(token, input),
    onSuccess: ponerCalificacion,
    onError: recargar,
  });

  return { confirmar, cambio, calificar, guardar, recargar };
}
