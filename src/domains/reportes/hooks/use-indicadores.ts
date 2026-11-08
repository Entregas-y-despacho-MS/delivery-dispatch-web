import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { leerPeriodoKpi } from "../reportes.kpis";
import type { PeriodoKpi } from "../reportes.types";
import { obtenerIndicadoresFlota } from "../services/reportes.service";

export const indicadoresFlotaKeys = createQueryKeys<{ period: PeriodoKpi }>("fleet-kpis");

/**
 * KPIs de la flota (ST-61.2, RF-A14). El período vive en la URL (`?periodo=`), así que al recargar o
 * compartir el link se abre el mismo. Mientras carga el nuevo período se sigue mostrando el anterior.
 */
export function useIndicadoresFlota() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periodo = leerPeriodoKpi(searchParams);

  const indicadores = useQuery({
    queryKey: indicadoresFlotaKeys.lists({ period: periodo }),
    queryFn: ({ signal }) => obtenerIndicadoresFlota(periodo, signal),
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  const setPeriodo = (siguiente: PeriodoKpi) =>
    setSearchParams((actuales) => {
      const url = new URLSearchParams(actuales);
      url.set("periodo", siguiente);
      return url;
    }, { replace: true });

  return { periodo, setPeriodo, indicadores };
}
