import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import type { ParamsReporteFlota } from "../reportes.flota";
import { escribirFiltrosSla, leerFiltrosSla, problemaRango } from "../reportes.reglas";
import type { FiltrosSla } from "../types/reportes.types";
import { obtenerReporteFlota } from "../services/reporte-flota.service";

export const reporteFlotaKeys = createQueryKeys<{ from: string; to: string }>("fleet-report");

/**
 * Reporte de flota (ST-65.2). Usa el mismo `desde`/`hasta` de la URL que el reporte SLA, así al
 * cambiar de pestaña se mantiene el período. Con un rango inválido no se consulta al back.
 */
export function useReporteFlota({ habilitado = true }: { habilitado?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosSla(searchParams), [searchParams]);
  const { desde, hasta } = filtros;
  const problema = problemaRango({ desde, hasta });
  const params = useMemo<ParamsReporteFlota>(() => ({ from: desde, to: hasta }), [desde, hasta]);

  const reporte = useQuery({
    queryKey: reporteFlotaKeys.lists({ ...params }),
    queryFn: ({ signal }) => obtenerReporteFlota(params, signal),
    enabled: habilitado && problema === null,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  const actualizar = (cambios: Partial<FiltrosSla>) =>
    setSearchParams((actuales) => escribirFiltrosSla({ ...leerFiltrosSla(actuales), ...cambios }, actuales), { replace: true });

  return {
    filtros: { desde, hasta },
    problemaRango: problema,
    reporte,
    setDesde: (valor: string) => actualizar({ desde: valor }),
    setHasta: (valor: string) => actualizar({ hasta: valor }),
    refrescar: () => reporte.refetch(),
  };
}
