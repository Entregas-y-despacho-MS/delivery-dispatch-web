import { useMemo } from "react";
import { History } from "lucide-react";

import { HistorialDespachosToolbar, HistorialDespachosVista, useHistorialDespachos, useTableroKanbanFiltros } from "@/domains/despachos";
import { PageHeader } from "@/shared/components/common/page-header";
import { PagedTableControls } from "@/shared/components/common/paged-table-controls";

const hrefFicha = (id: number) => `/app/despachos/${id}`;

/** Historial de despachos finalizados (ST-55.1, RF-A08). */
export default function HistorialPage() {
  const h = useHistorialDespachos();
  const { historial, filtros } = h;
  const catalogo = useTableroKanbanFiltros();
  const conductores = useMemo(
    () => (catalogo.data?.drivers ?? []).map(({ id, fullName }) => ({ id, name: fullName })),
    [catalogo.data],
  );
  const listo = !h.rangoInvertido && !historial.isLoading && !historial.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Historial de despachos"
        icon={History}
        description="Despachos que ya terminaron: entregados, no entregados, devueltos o cancelados. Lo cerrado más reciente aparece primero."
      />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Historial de despachos finalizados">
        <div className="border-b pb-4">
          <HistorialDespachosToolbar
            busqueda={h.busqueda}
            onBusquedaChange={h.setBusqueda}
            desde={filtros.desde}
            onDesdeChange={h.setDesde}
            hasta={filtros.hasta}
            onHastaChange={h.setHasta}
            conductores={conductores}
            conductor={filtros.conductor}
            onConductorChange={h.setConductor}
            placa={h.placa}
            onPlacaChange={h.setPlaca}
            estado={filtros.estado}
            onEstadoChange={h.setEstado}
            rangoInvertido={h.rangoInvertido}
            onExportar={h.exportar}
            exportando={h.exportando}
            puedeExportar={listo && historial.total > 0}
            onRefrescar={h.refrescar}
            refrescando={historial.isFetching}
          />
        </div>

        {!h.rangoInvertido && (
          <div aria-busy={historial.isFetching}>
            <HistorialDespachosVista
              data={historial.data}
              cargando={historial.isLoading}
              error={historial.isError ? historial.error : undefined}
              onReintentar={h.refrescar}
              reintentando={historial.isFetching}
              filtrada={h.hayFiltros}
              onLimpiarFiltros={h.limpiarFiltros}
              orden={filtros.orden}
              dir={filtros.dir}
              onToggleOrden={h.toggleOrden}
              hrefFicha={hrefFicha}
            />
          </div>
        )}

        {listo && historial.total > 0 && (
          <PagedTableControls
            page={filtros.pagina}
            totalPages={h.totalPaginas}
            total={historial.total}
            pageSize={filtros.filas}
            onPageChange={h.setPagina}
            onPageSizeChange={h.setFilas}
            itemLabel={historial.total === 1 ? "despacho" : "despachos"}
            busy={historial.isFetching}
          />
        )}
      </section>
    </div>
  );
}
