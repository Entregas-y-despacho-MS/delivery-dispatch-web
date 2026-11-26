import { useMemo } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { parseApiError } from "@/shared/lib/api-error";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import {
  escribirFiltrosReclamos,
  filtrosReclamosPorDefecto,
  leerFiltrosReclamos,
  paramsReclamos,
  problemaFiltrosReclamos,
  requiereReleer,
  type FiltrosReclamos,
} from "../reclamos.reglas";
import { emitirDictamen, iniciarInvestigacion, listarReclamos, obtenerReclamo, tomarReclamo } from "../services/reclamos.service";
import type { DictamenInput, ReclamoDetalle, ReclamosParams } from "../types/reclamos.types";

export const reclamosKeys = createQueryKeys<ReclamosParams>("complaint-cases");

/**
 * Bandeja de reclamos (ST-45.3). Filtros, página y caso abierto viven en la URL: cerrar el detalle o un error
 * no pierde la consulta. Con un rango inválido no se consulta.
 */
export function useReclamos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosReclamos(searchParams), [searchParams]);
  const problema = problemaFiltrosReclamos(filtros);
  const params = useMemo(() => paramsReclamos(filtros), [filtros]);
  const casoAbierto = Number(searchParams.get("caso")) || null;

  const bandeja = useQuery({
    queryKey: reclamosKeys.lists(params),
    queryFn: ({ signal }) => listarReclamos(params, signal),
    enabled: problema === null,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  /** Cambiar un filtro vuelve a la página 1; el caso abierto se mantiene. */
  const actualizar = (cambios: Partial<FiltrosReclamos>) =>
    setSearchParams((actuales) => escribirFiltrosReclamos({ ...leerFiltrosReclamos(actuales), pagina: 1, ...cambios }, actuales), { replace: true });

  const ponerCaso = (id: number | null) =>
    setSearchParams((actuales) => {
      const url = new URLSearchParams(actuales);
      if (id) url.set("caso", String(id));
      else url.delete("caso");
      return url;
    });

  return {
    filtros,
    problema,
    bandeja,
    reclamos: bandeja.data?.data ?? [],
    total: bandeja.data?.meta.total ?? 0,
    paginas: bandeja.data?.meta.pages ?? 1,
    actualizar,
    setPagina: (pagina: number) => actualizar({ pagina }),
    limpiarFiltros: () => actualizar(filtrosReclamosPorDefecto()),
    casoAbierto,
    abrirCaso: (id: number) => ponerCaso(id),
    cerrarCaso: () => ponerCaso(null),
  };
}

/**
 * Detalle y comandos de un caso. Cada comando devuelve el caso actualizado (acuse): se guarda en la caché y
 * se refresca la bandeja. Con 409 (versión vieja o transición inválida) se vuelve a leer el caso.
 */
export function useReclamo(id: number | null) {
  const queryClient = useQueryClient();
  const detalle = useQuery({
    queryKey: reclamosKeys.detail(id ?? 0),
    queryFn: ({ signal }) => obtenerReclamo(id ?? 0, signal),
    enabled: id !== null,
    ...QUERY_POLICIES.operational,
    retry: (fallos, error) => fallos < 2 && parseApiError(error).retryable,
  });

  const guardar = (caso: ReclamoDetalle) => {
    queryClient.setQueryData(reclamosKeys.detail(caso.complaintId), caso);
    void queryClient.invalidateQueries({ queryKey: [...reclamosKeys.all, "list"] });
  };
  const alFallar = (error: unknown) => {
    if (requiereReleer(parseApiError(error))) void detalle.refetch();
  };
  const version = () => detalle.data?.caseVersion ?? 0;

  const tomar = useMutation({ mutationFn: () => tomarReclamo(id ?? 0, version()), onSuccess: guardar, onError: alFallar });
  const iniciar = useMutation({ mutationFn: () => iniciarInvestigacion(id ?? 0, version()), onSuccess: guardar, onError: alFallar });
  const dictaminar = useMutation({
    mutationFn: (dictamen: DictamenInput) => emitirDictamen(id ?? 0, version(), dictamen),
    onSuccess: guardar,
    onError: alFallar,
  });

  return { detalle, tomar, iniciar, dictaminar };
}
