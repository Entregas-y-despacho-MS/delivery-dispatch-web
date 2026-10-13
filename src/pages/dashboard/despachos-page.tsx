import { useMemo } from "react";
import { ClipboardList, Inbox } from "lucide-react";

import { useZonas } from "@/domains/catalogos";
import { BandejaPedidosToolbar, BandejaPedidosVista, useBandejaPedidos } from "@/domains/despachos";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";

/** Zonas para el filtro rápido: el catálogo completo cabe en una página. */
const ZONAS_PARAMS = { page: 1, limit: 100 };

/** Bandeja central de pedidos pendientes de planificación (ST-48.1, RF-A40). */
export default function DespachosPage() {
  const bandeja = useBandejaPedidos();
  const { pedidos } = bandeja;
  const zonas = useZonas(ZONAS_PARAMS);
  const zonasOpciones = useMemo(() => zonas.data.map(({ id, name }) => ({ id, name })), [zonas.data]);
  const seleccionados = Object.keys(bandeja.seleccion).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Despachos"
        icon={ClipboardList}
        description="Pedidos listos y pendientes de planificación. Los que otro coordinador está armando aparecen bloqueados."
      />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Bandeja de pedidos pendientes">
        <div className="flex flex-col gap-4 border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Bandeja de pedidos</h2>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {pedidos.total} {pedidos.total === 1 ? "pedido pendiente" : "pedidos pendientes"}
              {seleccionados > 0 && ` · ${seleccionados} ${seleccionados === 1 ? "seleccionado" : "seleccionados"}`}
            </p>
          </div>
          <BandejaPedidosToolbar
            search={bandeja.search}
            onSearchChange={bandeja.setSearch}
            zonas={zonasOpciones}
            zona={bandeja.zonaFilter}
            onZonaChange={bandeja.setZonaFilter}
            turno={bandeja.turnoFilter}
            onTurnoChange={bandeja.setTurnoFilter}
            prioridad={bandeja.prioridadFilter}
            onPrioridadChange={bandeja.setPrioridadFilter}
            onRefrescar={bandeja.refrescar}
            refrescando={pedidos.isFetching}
          />
        </div>

        <div aria-busy={pedidos.isFetching}>
          <BandejaPedidosVista
            data={pedidos.data}
            loading={pedidos.isLoading}
            error={pedidos.isError ? pedidos.error : undefined}
            onReintentar={bandeja.refrescar}
            reintentando={pedidos.isFetching}
            filtrada={bandeja.hasFilters}
            onLimpiarFiltros={bandeja.clearFilters}
            orden={bandeja.orden}
            onToggleOrden={bandeja.toggleOrden}
            seleccion={bandeja.seleccion}
            onSeleccionChange={bandeja.setSeleccion}
          />
        </div>

        {!pedidos.isLoading && !pedidos.isError && pedidos.total > 0 && (
          <PaginationControls page={bandeja.page} totalPages={bandeja.totalPages} onPageChange={bandeja.setPage} />
        )}
      </section>
    </div>
  );
}
