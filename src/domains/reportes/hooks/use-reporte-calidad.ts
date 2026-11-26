import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { createQueryKeys } from "@/shared/lib/query-keys";
import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import {
  escribirFiltrosCalidad,
  leerFiltrosCalidad,
  paramsCalidad,
  problemaCalidad,
  type FiltrosCalidad,
  type ParamsCalidad,
} from "../reportes.calidad";
import { escribirFiltrosSla, leerFiltrosSla } from "../reportes.reglas";
import { obtenerReporteCalidad } from "../services/calidad.service";

export const calidadKeys = createQueryKeys<ParamsCalidad>("quality-report");

/**
 * Dashboard 4 (ST-300.3). Un solo pedido trae KPIs y tablas: todos los filtros los mueven juntos. Con un período
 * inválido no se consulta. Cambiar un filtro vuelve a la página 1.
 */
export function useReporteCalidad({ habilitado = true }: { habilitado?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosCalidad(searchParams), [searchParams]);
  const problema = problemaCalidad(filtros);
  const params = useMemo(() => paramsCalidad(filtros), [filtros]);

  const reporte = useQuery({
    queryKey: calidadKeys.lists(params),
    queryFn: ({ signal }) => obtenerReporteCalidad(params, signal),
    enabled: habilitado && problema === null,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  const actualizar = (cambios: Partial<FiltrosCalidad>) =>
    setSearchParams((actuales) => escribirFiltrosCalidad({ ...leerFiltrosCalidad(actuales), pagina: 1, ...cambios }, actuales), { replace: true });
  const periodo = (cambios: { desde?: string; hasta?: string }) =>
    setSearchParams((actuales) => {
      const url = escribirFiltrosSla({ ...leerFiltrosSla(actuales), ...cambios }, actuales);
      url.delete("paginaCalidad");
      return url;
    }, { replace: true });

  return {
    filtros,
    problema,
    reporte,
    actualizar,
    setDesde: (desde: string) => periodo({ desde }),
    setHasta: (hasta: string) => periodo({ hasta }),
    setPagina: (pagina: number) => actualizar({ pagina }),
    limpiarFiltros: () => actualizar({ zona: null, estado: null, motivoIncidencia: null, motivoReclamo: "", reprogramado: null }),
  };
}
