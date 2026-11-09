import { useMemo } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import {
  errorRecojo,
  escribirFiltrosRecojos,
  leerFiltrosRecojos,
  paramsRecojos,
  rangoRecojosInvertido,
  type ErrorRecojo,
  type FiltrosRecojos,
} from "../recojos.reglas";
import type { CrearRecojoInput, RecojoListParams } from "../recojos.types";
import { recojosService } from "../services/recojos.service";

export const recojosKeys = createQueryKeys<RecojoListParams>("pickup-orders");
export const almacenesKeys = createQueryKeys("warehouses");

/**
 * Listado de recojos (ST-81.1) con los filtros en la URL. Con el rango de fechas al revés no se
 * consulta. Hasta que exista el socket del front, se refresca al volver a la pestaña y después de
 * crear o anular.
 */
export function useRecojos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosRecojos(searchParams), [searchParams]);
  const invertido = rangoRecojosInvertido(filtros);
  const params = useMemo(() => paramsRecojos(filtros), [filtros]);

  const listado = useQuery({
    queryKey: recojosKeys.lists(params),
    queryFn: ({ signal }) => recojosService.listar(params, signal),
    enabled: !invertido,
    ...QUERY_POLICIES.operational,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  /** Cambiar un filtro vuelve a la página 1; cambiar de página no toca los filtros. */
  const actualizar = (cambios: Partial<FiltrosRecojos>) =>
    setSearchParams(
      (actuales) => escribirFiltrosRecojos({ ...leerFiltrosRecojos(actuales), pagina: 1, ...cambios }, actuales),
      { replace: true },
    );

  return {
    filtros,
    rangoInvertido: invertido,
    listado,
    recojos: listado.data?.data ?? [],
    total: listado.data?.meta.total ?? 0,
    paginas: listado.data?.meta.pages ?? 1,
    setEstado: (estado: string | null) => actualizar({ estado }),
    setOrigen: (origen: FiltrosRecojos["origen"]) => actualizar({ origen }),
    setDesde: (desde: string) => actualizar({ desde }),
    setHasta: (hasta: string) => actualizar({ hasta }),
    setPagina: (pagina: number) => actualizar({ pagina }),
    limpiarFiltros: () => actualizar({ estado: null, origen: null, desde: "", hasta: "" }),
  };
}

/** Almacenes activos para el destino del recojo. Solo se piden cuando se abre el formulario. */
export function useAlmacenes({ habilitado = true }: { habilitado?: boolean } = {}) {
  return useQuery({
    queryKey: almacenesKeys.lists({ active: "true" }),
    queryFn: ({ signal }) => recojosService.listarAlmacenes(signal),
    enabled: habilitado,
    ...QUERY_POLICIES.catalog,
  });
}

/** Crear y anular recojos. Devuelven null si salió bien, o el error para mostrarlo. */
export function useAccionesRecojo() {
  const queryClient = useQueryClient();
  const refrescar = () => queryClient.invalidateQueries({ queryKey: recojosKeys.all });

  const crear = useMutation({
    mutationFn: (input: CrearRecojoInput) => recojosService.crear(input),
    onSuccess: (recojo) => {
      toast.success(recojo.trackingCode ? `Recojo ${recojo.trackingCode} registrado.` : "Recojo registrado.");
    },
    onSettled: refrescar,
  });

  const anular = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => recojosService.anular(id, motivo),
    onSuccess: () => {
      toast.success("Recojo anulado.");
    },
    // Si falló porque ya cambió de estado, la lista se actualiza igual.
    onSettled: refrescar,
  });

  const intentar = async (accion: () => Promise<unknown>): Promise<ErrorRecojo | null> => {
    try {
      await accion();
      return null;
    } catch (error) {
      return errorRecojo(error);
    }
  };

  return {
    crear: (input: CrearRecojoInput) => intentar(() => crear.mutateAsync(input)),
    creando: crear.isPending,
    anular: (id: number, motivo: string) => intentar(() => anular.mutateAsync({ id, motivo })),
    anulando: anular.isPending,
  };
}
