import { useMemo } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import {
  errorMantenimiento,
  escribirFiltrosMantenimiento,
  leerFiltrosMantenimiento,
  paramsMantenimiento,
  rangoInvertido,
  type ErrorMantenimiento,
  type FiltrosMantenimiento,
} from "../flota.mantenimiento";
import type { EstadoMantenimiento, MantenimientoListParams, RegistrarMantenimientoInput } from "../types/flota.types";
import { mantenimientosService } from "../services/mantenimientos.service";

export const mantenimientosKeys = createQueryKeys<MantenimientoListParams>("vehicle-maintenances");
/** Mismo scope que useVehiculos (useCrud "vehicles"): al cambiar un mantenimiento cambia el estado del vehículo. */
const VEHICULOS_KEY = ["vehicles"] as const;

/**
 * Historial de mantenimientos de toda la flota (ST-64.2). Los filtros viven en la URL; con un rango
 * de fechas al revés no se consulta al back.
 */
export function useHistorialMantenimientos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosMantenimiento(searchParams), [searchParams]);
  const invertido = rangoInvertido(filtros);
  const params = useMemo(() => paramsMantenimiento(filtros), [filtros]);

  const historial = useQuery({
    queryKey: mantenimientosKeys.lists(params),
    queryFn: ({ signal }) => mantenimientosService.listar(params, signal),
    enabled: !invertido,
    ...QUERY_POLICIES.operational,
    placeholderData: keepPreviousData,
  });

  /** Cambiar un filtro vuelve a la página 1; cambiar de página no toca los filtros. */
  const actualizar = (cambios: Partial<FiltrosMantenimiento>) =>
    setSearchParams(
      (actuales) => escribirFiltrosMantenimiento(
        { ...leerFiltrosMantenimiento(actuales), pagina: 1, ...cambios },
        actuales,
      ),
      { replace: true },
    );

  return {
    filtros,
    rangoInvertido: invertido,
    historial,
    mantenimientos: historial.data?.data ?? [],
    total: historial.data?.meta.total ?? 0,
    paginas: historial.data?.meta.pages ?? 1,
    setVehiculo: (vehiculoId: number | null) => actualizar({ vehiculoId }),
    setEstado: (estado: EstadoMantenimiento | null) => actualizar({ estado }),
    setDesde: (desde: string) => actualizar({ desde }),
    setHasta: (hasta: string) => actualizar({ hasta }),
    setPagina: (pagina: number) => actualizar({ pagina }),
    limpiarFiltros: () => actualizar({ vehiculoId: null, estado: null, desde: "", hasta: "" }),
  };
}

/** Registrar una incidencia y avanzar un mantenimiento. Devuelven null si salió bien, o el error. */
export function useAccionesMantenimiento() {
  const queryClient = useQueryClient();
  const refrescar = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: mantenimientosKeys.all }),
    queryClient.invalidateQueries({ queryKey: VEHICULOS_KEY }),
  ]);

  const avanzar = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: Exclude<EstadoMantenimiento, "pending"> }) =>
      mantenimientosService.cambiarEstado(id, estado),
    onSuccess: (guardado) => {
      if (guardado.status === "in_progress") toast.success("Mantenimiento iniciado.");
      else if (guardado.vehicleStatus === "active") toast.success("Mantenimiento completado. El vehículo volvió a estar disponible.");
      else toast.success("Mantenimiento completado.");
    },
    // Si falló porque otro ya lo cambió, la lista se actualiza igual.
    onSettled: refrescar,
  });

  const registrar = useMutation({
    mutationFn: (input: RegistrarMantenimientoInput) => mantenimientosService.registrar(input),
    onSuccess: (guardado) => {
      toast.success(guardado.vehicleStatus === "maintenance"
        ? "Incidencia registrada. El vehículo pasó a mantenimiento."
        : "Incidencia registrada.");
    },
    onSettled: refrescar,
  });

  const intentar = async (accion: () => Promise<unknown>): Promise<ErrorMantenimiento | null> => {
    try {
      await accion();
      return null;
    } catch (error) {
      return errorMantenimiento(error);
    }
  };

  return {
    avanzar: (id: number, estado: Exclude<EstadoMantenimiento, "pending">) =>
      intentar(() => avanzar.mutateAsync({ id, estado })),
    avanzando: avanzar.isPending,
    registrar: (input: RegistrarMantenimientoInput) => intentar(() => registrar.mutateAsync(input)),
    registrando: registrar.isPending,
  };
}
