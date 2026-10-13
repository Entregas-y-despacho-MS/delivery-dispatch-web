import { useMemo, useState } from "react";

import { useCrud } from "@/shared/hooks/use-crud";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import { pedidosPendientesService } from "../services/pedidos-pendientes.service";
import type {
  OrdenBandeja,
  PedidoPendiente,
  PedidosPendientesParams,
  PrioridadPedido,
  TurnoPedido,
} from "../despachos.types";

const PAGE_SIZE = 10;

/** "all" o el id de la zona como texto (los filtros de lista son strings). */
export type ZonaFilter = "all" | `${number}`;
export type TurnoFilter = "all" | TurnoPedido;
export type PrioridadFilter = "all" | PrioridadPedido;

export interface OrdenActual {
  sortBy: OrdenBandeja;
  order: "asc" | "desc";
}

/** Pedidos marcados, por id (mismo formato que la selección de TanStack Table). */
export type SeleccionPedidos = Record<string, true>;

/**
 * Estado de la bandeja central (ST-48.1): búsqueda con debounce de 300 ms,
 * filtros por zona, turno y prioridad, orden en el servidor y paginación.
 * Sin orden explícito, el back muestra urgentes primero y luego por vencimiento de SLA.
 */
export function useBandejaPedidos() {
  const list = useListFilters<{ zona: ZonaFilter; turno: TurnoFilter; prioridad: PrioridadFilter }>(
    { zona: "all", turno: "all", prioridad: "all" },
    300,
  );
  const { search, debouncedSearch, page, setPage, clearFilters, hasFilters } = list;
  const zonaFilter = list.filters.zona;
  const turnoFilter = list.filters.turno;
  const prioridadFilter = list.filters.prioridad;
  const [orden, setOrden] = useState<OrdenActual | null>(null);

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
    setOrden((actual) => {
      if (actual?.sortBy !== sortBy) return { sortBy, order: "asc" };
      return actual.order === "asc" ? { sortBy, order: "desc" } : null;
    });
    setPage(1);
  };

  return {
    pedidos,
    search,
    setSearch: list.setSearch,
    zonaFilter,
    setZonaFilter: (value: ZonaFilter) => list.setFilter("zona", value),
    turnoFilter,
    setTurnoFilter: (value: TurnoFilter) => list.setFilter("turno", value),
    prioridadFilter,
    setPrioridadFilter: (value: PrioridadFilter) => list.setFilter("prioridad", value),
    orden,
    toggleOrden,
    seleccion,
    setSeleccion,
    page,
    setPage,
    totalPages: Math.max(pedidos.pages ?? 0, 1),
    hasFilters,
    clearFilters,
    refrescar: () => pedidos.refetch(),
  };
}
