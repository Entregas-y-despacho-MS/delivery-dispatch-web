import { useMemo, useState } from "react";

import { useCrud } from "@/shared/hooks/use-crud";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import { pedidosPendientesService } from "../services/pedidos-pendientes.service";
import type {
  OrdenBandeja,
  PedidoPendiente,
  PedidosPendientesParams,
  TurnoPedido,
} from "../despachos.types";

const PAGE_SIZE = 10;

/** "all" o el id de la zona como texto (los filtros de lista son strings). */
export type ZonaFilter = "all" | `${number}`;
export type TurnoFilter = "all" | TurnoPedido;

export interface OrdenActual {
  sortBy: OrdenBandeja;
  order: "asc" | "desc";
}

/**
 * Estado de la bandeja central (ST-48.1): búsqueda con debounce de 300 ms,
 * filtros por zona y turno, orden en el servidor y paginación.
 * Sin orden explícito, el back muestra urgentes primero y luego por vencimiento de SLA.
 */
export function useBandejaPedidos() {
  const list = useListFilters<{ zona: ZonaFilter; turno: TurnoFilter }>({ zona: "all", turno: "all" }, 300);
  const { search, debouncedSearch, page, setPage, clearFilters, hasFilters } = list;
  const zonaFilter = list.filters.zona;
  const turnoFilter = list.filters.turno;
  const [orden, setOrden] = useState<OrdenActual | null>(null);

  const params = useMemo<PedidosPendientesParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    delivery_zone_id: zonaFilter === "all" ? undefined : Number(zonaFilter),
    shift: turnoFilter === "all" ? undefined : turnoFilter,
    sortBy: orden?.sortBy,
    order: orden?.order,
  }), [page, debouncedSearch, zonaFilter, turnoFilter, orden]);

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
    orden,
    toggleOrden,
    page,
    setPage,
    totalPages: Math.max(pedidos.pages ?? 0, 1),
    hasFilters,
    clearFilters,
    refrescar: () => pedidos.refetch(),
  };
}
