import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { createQueryKeys } from "@/shared/lib/query-keys";
import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import {
  escribirFiltrosProveedores,
  leerFiltrosProveedores,
  paramsProveedores,
  problemaProveedores,
  type FiltrosProveedores,
  type ParamsProveedores,
} from "../reportes.proveedores";
import { escribirFiltrosSla, leerFiltrosSla } from "../reportes.reglas";
import { listarAlmacenesReporte, obtenerCumplimientoProveedores } from "../services/proveedores.service";

export const proveedoresKeys = createQueryKeys<ParamsProveedores>("supplier-pickups-report");

/** Desempeño de proveedores (ST-305.2): un pedido trae tarjetas y excepciones; la página de excepciones es local. */
export function useReporteProveedores({ habilitado = true }: { habilitado?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosProveedores(searchParams), [searchParams]);
  const problema = problemaProveedores(filtros);
  const params = useMemo(() => paramsProveedores(filtros), [filtros]);

  const reporte = useQuery({
    queryKey: proveedoresKeys.lists(params),
    queryFn: ({ signal }) => obtenerCumplimientoProveedores(params, signal),
    enabled: habilitado && problema === null,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });
  const almacenes = useQuery({
    queryKey: ["warehouses", "report-options"],
    queryFn: ({ signal }) => listarAlmacenesReporte(signal),
    enabled: habilitado,
    ...QUERY_POLICIES.catalog,
  });

  const actualizar = (cambios: Partial<FiltrosProveedores>) =>
    setSearchParams((actuales) => escribirFiltrosProveedores({ ...leerFiltrosProveedores(actuales), pagina: 1, ...cambios }, actuales), { replace: true });
  const periodo = (cambios: { desde?: string; hasta?: string }) =>
    setSearchParams((actuales) => {
      const url = escribirFiltrosSla({ ...leerFiltrosSla(actuales), ...cambios }, actuales);
      url.delete("paginaProveedores");
      return url;
    }, { replace: true });

  return {
    filtros,
    problema,
    reporte,
    almacenes: almacenes.data ?? [],
    actualizar,
    setDesde: (desde: string) => periodo({ desde }),
    setHasta: (hasta: string) => periodo({ hasta }),
    setPagina: (pagina: number) => actualizar({ pagina }),
    limpiarFiltros: () => actualizar({ proveedor: "", almacen: null, estado: null }),
  };
}
