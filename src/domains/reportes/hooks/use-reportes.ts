import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { escribirFiltrosSla, leerFiltrosSla, paramsReporteSla, problemaRango } from "../reportes.reglas";
import type { FiltrosSla, ParamsReporteSla } from "../types/reportes.types";
import { obtenerReporteSla } from "../services/reportes.service";

export const reporteSlaKeys = createQueryKeys<{ from: string; to: string; groupBy: string }>("sla-report");

/**
 * Reporte de cumplimiento SLA (ST-54.1). Los filtros viven en la URL, así que al recargar o
 * compartir el link se abre el mismo reporte. Con un rango inválido no se consulta al back.
 */
export function useReporteSla({ habilitado = true }: { habilitado?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosSla(searchParams), [searchParams]);
  const problema = problemaRango(filtros);
  const params = useMemo<ParamsReporteSla>(() => paramsReporteSla(filtros), [filtros]);

  const reporte = useQuery({
    queryKey: reporteSlaKeys.lists({ ...params }),
    queryFn: ({ signal }) => obtenerReporteSla(params, signal),
    enabled: habilitado && problema === null,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  const actualizar = (cambios: Partial<FiltrosSla>) =>
    setSearchParams((actuales) => escribirFiltrosSla({ ...leerFiltrosSla(actuales), ...cambios }, actuales), { replace: true });

  return {
    filtros,
    problemaRango: problema,
    reporte,
    setDesde: (desde: string) => actualizar({ desde }),
    setHasta: (hasta: string) => actualizar({ hasta }),
    setAgrupacion: (agrupacion: FiltrosSla["agrupacion"]) => actualizar({ agrupacion }),
    refrescar: () => reporte.refetch(),
  };
}
