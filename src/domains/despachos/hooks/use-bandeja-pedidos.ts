import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useCrud } from "@/shared/hooks/use-crud";
import { pedidosPendientesService } from "../services/pedidos-pendientes.service";
import type { OrdenBandeja, PedidoPendiente, PedidosPendientesParams } from "../types/despachos.types";
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
const DEBOUNCE_BUSQUEDA_MS = 300;

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

  /** Cambia filtros en la URL. Salvo que se pida otra página, vuelve a la 1. `replace` evita llenar el historial. */
  const actualizar = (cambios: Partial<FiltrosBandeja>) => {
    setSearchParams((actuales) => escribirFiltrosBandeja({ ...leerFiltrosBandeja(actuales), page: 1, ...cambios }, actuales), { replace: true });
  };

  // Lo que se escribe vive en el input y se pasa a la URL tras 300 ms sin teclear. Escribir cada tecla
  // directo en la URL perdía letras al teclear rápido (cada cambio pisaba al anterior antes de aplicarse).
  const [textoBusqueda, setTextoBusqueda] = useState(search);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const setSearch = (value: string) => {
    setTextoBusqueda(value);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => actualizar({ search: value.trim() }), DEBOUNCE_BUSQUEDA_MS);
  };

  const params = useMemo<PedidosPendientesParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    delivery_zone_id: zonaFilter === "all" ? undefined : Number(zonaFilter),
    shift: turnoFilter === "all" ? undefined : turnoFilter,
    priority: prioridadFilter === "all" ? undefined : prioridadFilter,
    sortBy: orden?.sortBy,
    order: orden?.order,
  }), [page, search, zonaFilter, turnoFilter, prioridadFilter, orden]);

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

  const hasFilters = Boolean(textoBusqueda.trim()) || zonaFilter !== "all" || turnoFilter !== "all" || prioridadFilter !== "all";

  return {
    pedidos,
    search: textoBusqueda,
    setSearch,
    zonaFilter,
    setZonaFilter: (value: ZonaFilter) => actualizar({ zona: value }),
    turnoFilter,
    setTurnoFilter: (value: TurnoFilter) => actualizar({ turno: value }),
    prioridadFilter,
    setPrioridadFilter: (value: PrioridadFilter) => actualizar({ prioridad: value }),
    /** «Solo urgentes» (ST-58.1): equivale a la prioridad «Urgentes». */
    soloUrgentes: prioridadFilter === "urgent",
    /**
     * Al activarlo filtra urgentes y quita el orden por columna: sin `sortBy`, el back los entrega
     * ordenados por vencimiento de SLA (el que vence antes, primero). Al apagarlo vuelve a toda prioridad.
     */
    setSoloUrgentes: (activo: boolean) => actualizar(activo ? { prioridad: "urgent", orden: null } : { prioridad: "all" }),
    orden,
    toggleOrden,
    seleccion,
    setSeleccion,
    page,
    setPage: (value: number) => actualizar({ page: value }),
    totalPages: Math.max(pedidos.pages ?? 0, 1),
    hasFilters,
    /** Limpia búsqueda y filtros; el orden elegido se mantiene. */
    clearFilters: () => {
      clearTimeout(temporizador.current);
      setTextoBusqueda("");
      actualizar({ search: "", zona: FILTROS_BANDEJA_INICIALES.zona, turno: "all", prioridad: "all" });
    },
    refrescar: () => pedidos.refetch(),
  };
}
