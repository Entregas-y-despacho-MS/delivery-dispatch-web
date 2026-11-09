import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { parseApiError } from "@/shared/lib/api-error";
import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import {
  escribirFiltrosAlertas,
  filtrarPorTipo,
  leerFiltrosAlertas,
  mensajeErrorAtender,
  ordenarAlertas,
  paramsAlertas,
} from "../incidencias.alertas";
import type { EstadoAlerta, FiltrosAlertas } from "../incidencias.types";
import { atenderAlerta, listarAlertas } from "../services/alertas.service";

export const alertasKeys = createQueryKeys<{ status?: EstadoAlerta; page: number; limit: number }>("operational-alerts");

/** Solo interesa `meta.total`: un elemento basta para saber cuántas siguen abiertas. */
const PARAMS_CONTADOR = { status: "open", page: 1, limit: 1 } as const;

/** Cantidad de alertas abiertas para la campana. El socket la invalida al llegar una nueva. */
export function useContadorAlertas({ habilitado = true }: { habilitado?: boolean } = {}) {
  const contador = useQuery({
    queryKey: alertasKeys.lists(PARAMS_CONTADOR),
    queryFn: ({ signal }) => listarAlertas(PARAMS_CONTADOR, signal),
    ...QUERY_POLICIES.live,
    enabled: habilitado,
    select: (respuesta) => respuesta.meta.total,
  });
  return { total: contador.data ?? 0, contador };
}

/**
 * Lista de la página Alertas (ST-66.3). Los filtros viven en la URL (`?tipo=` y `?estado=`).
 * El estado lo filtra el back; el tipo se filtra aquí sobre lo recibido.
 */
export function useAlertas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = leerFiltrosAlertas(searchParams);
  const params = paramsAlertas(filtros);

  const lista = useQuery({
    queryKey: alertasKeys.lists(params),
    queryFn: ({ signal }) => listarAlertas(params, signal),
    ...QUERY_POLICIES.live,
    placeholderData: keepPreviousData,
  });

  const recibidas = lista.data?.data ?? [];
  const alertas = ordenarAlertas(filtrarPorTipo(recibidas, filtros.tipo));
  /** Hay más alertas que las recibidas (el back entrega como máximo 100 por página). */
  const incompleta = (lista.data?.meta.total ?? 0) > recibidas.length;

  const setFiltros = (siguientes: FiltrosAlertas) =>
    setSearchParams((actuales) => escribirFiltrosAlertas(siguientes, actuales), { replace: true });

  return { filtros, setFiltros, alertas, incompleta, lista };
}

/** «Marcar atendida»: al terminar, bien o mal, se recargan la lista y el contador. */
export function useAtenderAlerta() {
  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: atenderAlerta,
    onSuccess: () => toast.success("Alerta marcada como atendida."),
    onError: (error) => toast.error(mensajeErrorAtender(parseApiError(error))),
    onSettled: () => queryClient.invalidateQueries({ queryKey: alertasKeys.all }),
  });

  return {
    atender: (id: number) => mutacion.mutate(id),
    /** Id de la alerta que se está marcando, para deshabilitar solo su botón. */
    atendiendoId: mutacion.isPending ? mutacion.variables : null,
  };
}
