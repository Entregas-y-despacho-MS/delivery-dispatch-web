import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { createQueryKeys } from "@/shared/lib/query-keys";
import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import {
  escribirFiltrosDisponibilidad,
  leerFiltrosDisponibilidad,
  paramsDisponibilidad,
  type FiltrosDisponibilidad,
  type ParamsDisponibilidad,
} from "../reportes.disponibilidad";
import { obtenerDisponibilidadFlota } from "../services/disponibilidad-flota.service";

export const disponibilidadKeys = createQueryKeys<ParamsDisponibilidad>("fleet-availability");

interface Opciones {
  /** Período compartido con el reporte de flota o con los KPIs: los paneles se mueven juntos. */
  desde: string;
  hasta: string;
  habilitado?: boolean;
  /** Supervisor (o root): ve el detalle por repartidor y puede filtrar por conductor. */
  puedeVerConductor: boolean;
}

/** Dashboard 3 (ST-303.2): corte, vehículo, conductor, estado y mantenimiento en la URL. */
export function useDisponibilidadFlota({ desde, hasta, habilitado = true, puedeVerConductor }: Opciones) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosDisponibilidad(searchParams), [searchParams]);
  const params = useMemo(() => paramsDisponibilidad(filtros, desde, hasta, puedeVerConductor), [filtros, desde, hasta, puedeVerConductor]);

  const disponibilidad = useQuery({
    queryKey: disponibilidadKeys.lists(params),
    queryFn: ({ signal }) => obtenerDisponibilidadFlota(params, signal),
    enabled: habilitado,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  const actualizar = (cambios: Partial<FiltrosDisponibilidad>) =>
    setSearchParams((actuales) => escribirFiltrosDisponibilidad({ ...leerFiltrosDisponibilidad(actuales), ...cambios }, actuales), { replace: true });

  return {
    filtros,
    disponibilidad,
    actualizar,
    limpiarFiltros: () => actualizar({ vehiculo: null, conductor: null, estado: null, mantenimiento: null }),
  };
}
