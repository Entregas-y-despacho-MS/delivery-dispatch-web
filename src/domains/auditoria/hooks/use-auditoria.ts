import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import {
  escribirFiltrosAuditoria,
  filtrosAuditoriaPorDefecto,
  leerFiltrosAuditoria,
  paramsAuditoria,
  problemaFiltrosAuditoria,
  type FiltrosAuditoria,
} from "../auditoria.reglas";
import type { AuditoriaParams } from "../types/auditoria.types";
import { buscarEventosAuditoria } from "../services/auditoria.service";

export const auditoriaKeys = createQueryKeys<AuditoriaParams>("admin-audit-events");

/**
 * Búsqueda de auditoría (ST-70.2). Los filtros, la página y el evento abierto viven en la URL: al
 * cerrar el detalle o volver atrás se conserva la consulta. Con filtros inválidos no se consulta.
 */
export function useAuditoria() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosAuditoria(searchParams), [searchParams]);
  const problema = problemaFiltrosAuditoria(filtros);
  const params = useMemo(() => paramsAuditoria(filtros), [filtros]);
  const eventoAbierto = searchParams.get("evento");

  const busqueda = useQuery({
    queryKey: auditoriaKeys.lists(params),
    queryFn: ({ signal }) => buscarEventosAuditoria(params, signal),
    enabled: problema === null,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  /** Cambiar un filtro vuelve a la página 1 y cierra el detalle. */
  const actualizar = (cambios: Partial<FiltrosAuditoria>) =>
    setSearchParams((actuales) => {
      const url = escribirFiltrosAuditoria({ ...leerFiltrosAuditoria(actuales), pagina: 1, ...cambios }, actuales);
      url.delete("evento");
      return url;
    }, { replace: true });

  const ponerEvento = (id: string | null) =>
    setSearchParams((actuales) => {
      const url = new URLSearchParams(actuales);
      if (id) url.set("evento", id);
      else url.delete("evento");
      return url;
    });

  const eventos = busqueda.data?.data ?? [];
  return {
    filtros,
    params,
    problema,
    busqueda,
    eventos,
    total: busqueda.data?.meta.total ?? 0,
    paginas: busqueda.data?.meta.pages ?? 1,
    actualizar,
    setPagina: (pagina: number) => actualizar({ pagina }),
    limpiarFiltros: () => {
      const { desde, hasta, orden } = filtros;
      actualizar({ ...filtrosAuditoriaPorDefecto(), desde, hasta, orden });
    },
    /** El evento abierto se busca en la página actual: el back no expone un detalle aparte. */
    eventoSeleccionado: eventoAbierto ? eventos.find((e) => e.eventId === eventoAbierto) ?? null : null,
    abrirEvento: (id: string) => ponerEvento(id),
    cerrarEvento: () => ponerEvento(null),
  };
}
