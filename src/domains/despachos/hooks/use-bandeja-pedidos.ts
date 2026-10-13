import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useCrud } from "@/shared/hooks/use-crud";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { pedidosPendientesService } from "../services/pedidos-pendientes.service";
import type { OrdenBandeja, PedidoPendiente, PedidosPendientesParams } from "../despachos.types";
import {
  escribirFiltrosBandeja,
  FILTROS_BANDEJA_INICIALES,
  leerFiltrosBandeja,
  type FiltrosBandeja,
  type PrioridadFilter,
  type TurnoFilter,
  type ZonaFilter,
} from "../despachos.url";

export type { OrdenActual, PrioridadFilter, TurnoFilter, ZonaFilter } from "../despachos.url";

const PAGE_SIZE = 10;

/** Pedidos marcados, por id (mismo formato que la selección de TanStack Table). */
export type SeleccionPedidos = Record<string, true>;

/**
 * Estado de la bandeja central (ST-48.1 / ST-58.1): búsqueda con debounce de 300 ms,
 * filtros por zona, turno y prioridad, orden en el servidor y paginación.
 * Todo vive en la URL: al recargar o compartir el link, la bandeja se abre igual.
 * Sin orden explícito, el back muestra urgentes primero y luego por vencimiento de SLA.
 */
export function useBandejaPedidos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosBandeja(searchParams), [searchParams]);
  const { search, zona: zonaFilter, turno: turnoFilter, prioridad: prioridadFilter, orden, page } = filtros;

  const delayedSearch = useDebounce(search.trim(), 300);
  const debouncedSearch = search.trim() ? delayedSearch : "";

  /** Cambia filtros en la URL. Salvo que se pida otra página, vuelve a la 1. `replace` evita llenar el historial. */
  const actualizar = (cambios: Partial<FiltrosBandeja>) => {
    setSearchParams((actuales) => escribirFiltrosBandeja({ ...leerFiltrosBandeja(actuales), page: 1, ...cambios }, actuales), { replace: true });
  };

  const params = useMemo<PedidosPendientesParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    delivery_zone_id: zonaFilter === "all" ? undefined : Number(zonaFilter),
    shift: turnoFilter === "all" ? undefined : turnoFilter,
    priority: prioridadFilter === "all" ? undefined : prioridadFilter,
    sortBy: orden?.sortBy,
    order: orden?.order,
  }), [page, debouncedSearch, zonaFilter, turnoFilter, prioridadFilter, orden]);

  // La selección pertenece a la consulta que la originó: si cambia la búsqueda, un filtro, el orden
  // o la página, se descarta sola. Así el contador nunca cuenta pedidos que ya no están a la vista.
  const claveConsulta = JSON.stringify(params);
  const [seleccionGuardada, setSeleccionGuardada] = useState<{ clave: string; ids: SeleccionPedidos }>({ clave: claveConsulta, ids: {} });
  const seleccion = seleccionGuardada.clave === claveConsulta ? seleccionGuardada.ids : {};
  const setSeleccion = (ids: SeleccionPedidos) => setSeleccionGuardada({ clave: claveConsulta, ids });

  // "live": las reservas de otros coordinadores cambian seguido, así que se refresca al volver a la pestaña.
  const pedidos = useCrud<PedidoPendiente, never, never, PedidosPendientesParams>(
    pedidosPendientesService,
    "pending-orders",
    { policy: "live", params },
  );

  /** Primer clic: ascendente; segundo: descendente; tercero: vuelve al orden por defecto. */
  const toggleOrden = (sortBy: OrdenBandeja) => {
    const siguiente = orden?.sortBy !== sortBy
      ? { sortBy, order: "asc" as const }
      : orden.order === "asc" ? { sortBy, order: "desc" as const } : null;
    actualizar({ orden: siguiente });
  };

  const hasFilters = Boolean(search.trim()) || zonaFilter !== "all" || turnoFilter !== "all" || prioridadFilter !== "all";

  return {
    pedidos,
    search,
    setSearch: (value: string) => actualizar({ search: value }),
    zonaFilter,
    setZonaFilter: (value: ZonaFilter) => actualizar({ zona: value }),
    turnoFilter,
    setTurnoFilter: (value: TurnoFilter) => actualizar({ turno: value }),
    prioridadFilter,
    setPrioridadFilter: (value: PrioridadFilter) => actualizar({ prioridad: value }),
    orden,
    toggleOrden,
    seleccion,
    setSeleccion,
    page,
    setPage: (value: number) => actualizar({ page: value }),
    totalPages: Math.max(pedidos.pages ?? 0, 1),
    hasFilters,
    /** Limpia búsqueda y filtros; el orden elegido se mantiene. */
    clearFilters: () => actualizar({ search: "", zona: FILTROS_BANDEJA_INICIALES.zona, turno: "all", prioridad: "all" }),
    refrescar: () => pedidos.refetch(),
  };
}
