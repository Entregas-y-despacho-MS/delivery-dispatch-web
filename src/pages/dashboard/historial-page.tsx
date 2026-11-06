import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, History, Search } from "lucide-react";
import { toast } from "sonner";

import { useHistorial, historialService, type EstadoFinalDespacho, type HistorialParams } from "@/domains/despachos";
import { useUsuarios } from "@/domains/usuarios";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { PageSkeleton } from "@/shared/components/feedback/page-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

const LABELS: Record<EstadoFinalDespacho, string> = { delivered: "Entregado", not_delivered: "No entregado", returned: "Devuelto", returned_to_warehouse: "Devuelto a almacén", cancelled: "Cancelado" };
const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat("es-BO", { dateStyle: "short", timeStyle: "short", timeZone: "America/La_Paz" }).format(new Date(value)) : "—";

export default function HistorialPage() {
  const [paramsUrl, setParamsUrl] = useSearchParams();
  const update = useCallback((changes: Record<string, string | null>) => {
    setParamsUrl((current) => { const next = new URLSearchParams(current); for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); } if (!("page" in changes)) next.delete("page"); return next; }, { replace: true });
  }, [setParamsUrl]);
  const page = Math.max(1, Number(paramsUrl.get("page")) || 1);
  const limit = Math.min(100, Math.max(10, Number(paramsUrl.get("limit")) || 10));
  const from = paramsUrl.get("from") ?? "";
  const to = paramsUrl.get("to") ?? "";
  const driverId = paramsUrl.get("driverId") ?? "all";
  const plate = paramsUrl.get("plate") ?? "";
  const status = paramsUrl.get("status") ?? "all";
  const search = paramsUrl.get("search") ?? "";
  const [exporting, setExporting] = useState(false);
  const users = useUsuarios({ page: 1, limit: 100, status: "active" });
  const drivers = useMemo(() => (users.data?.items ?? []).filter((user) => user.activo && user.rol.nombre === "driver"), [users.data]);


  const filters = useMemo<HistorialParams>(() => ({
    page, limit, sortBy: "closedAt", order: "desc",
    ...(from ? { from } : {}), ...(to ? { to } : {}),
    ...(driverId !== "all" ? { driverId: Number(driverId) } : {}),
    ...(plate.trim() ? { plate: plate.trim() } : {}),
    ...(status !== "all" ? { status: status as EstadoFinalDespacho } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }), [page, limit, from, to, driverId, plate, status, search]);
  const query = useHistorial(filters);

  async function exportar() {
    setExporting(true);
    try {
      const { page: _page, limit: _limit, ...appliedFilters } = filters;
      const blob = await historialService.exportCsv(appliedFilters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `historial-despachos-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
    } catch { toast.error("No se pudo exportar el historial. Revisa los filtros e inténtalo de nuevo."); }
    finally { setExporting(false); }
  }

  const rows = query.data?.data ?? [];
  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.limit)) : 1;
  return <div className="space-y-6">
    <PageHeader eyebrow="Control" title="Historial de despachos" icon={History} description="Consulta y exporta entregas cerradas. Combina filtros para localizar una orden." action={<Button onClick={() => void exportar()} disabled={exporting || rows.length === 0}><Download aria-hidden />{exporting ? "Preparando CSV…" : "Exportar historial"}</Button>} />
    <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Filtros del historial">
      <label className="space-y-1 text-sm"><span>Desde</span><Input type="date" value={from} onChange={(e) => update({ from: e.target.value || null })} /></label>
      <label className="space-y-1 text-sm"><span>Hasta</span><Input type="date" value={to} onChange={(e) => update({ to: e.target.value || null })} /></label>
      <label className="space-y-1 text-sm"><span>Repartidor</span><Select value={driverId} onValueChange={(value) => update({ driverId: value === "all" ? null : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{drivers.map((driver) => <SelectItem key={driver.id} value={String(driver.id)}>{driver.nombreCompleto}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-1 text-sm"><span>Placa</span><Input maxLength={15} value={plate} onChange={(e) => update({ plate: e.target.value || null })} placeholder="ABC-123" /></label>
      <label className="space-y-1 text-sm"><span>Estado final</span><Select value={status} onValueChange={(value) => update({ status: value === "all" ? null : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem>{Object.entries(LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-1 text-sm"><span>Código de guía</span><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input className="pl-9" value={search} onChange={(e) => update({ search: e.target.value || null })} placeholder="DSP-2026-00012" /></div></label>
    </section>
    {query.isLoading ? <PageSkeleton /> : query.isError ? <ErrorAlert error={query.error} title="No se pudo cargar el historial" onRetry={() => void query.refetch()} isRetrying={query.isFetching} /> : rows.length === 0 ? (from || to || driverId !== "all" || plate || status !== "all" || search) ? <NoResultsState title="No hay despachos con esos filtros" description="Cambia o limpia uno de los filtros para ampliar la búsqueda." onClearFilters={() => setParamsUrl({}, { replace: true })} /> : <EmptyState icon={<History className="size-6" aria-hidden />} title="Todavía no hay despachos cerrados" description="Cuando se cierre una entrega, aparecerá aquí." /> : <>
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block"><Table><TableHeader><TableRow><TableHead>Código de traslado</TableHead><TableHead>Cliente</TableHead><TableHead>Repartidor</TableHead><TableHead>Vehículo</TableHead><TableHead>Partida</TableHead><TableHead>Entrega</TableHead><TableHead>Estado</TableHead><TableHead><span className="sr-only">Acción</span></TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="font-mono text-xs">{row.trackingCode ?? `Despacho #${row.id}`}</TableCell><TableCell>{row.recipient ?? "Sin nombre"}</TableCell><TableCell>{row.driverName ?? "—"}</TableCell><TableCell>{row.plate ?? "—"}</TableCell><TableCell>{dateTime(row.departedAt)}</TableCell><TableCell>{dateTime(row.deliveredAt)}</TableCell><TableCell><Badge variant="outline">{LABELS[row.status]}</Badge></TableCell><TableCell><Link className="text-sm text-primary underline underline-offset-4" to={`/app/despachos/${row.id}`}>Ver ficha</Link></TableCell></TableRow>)}</TableBody></Table></div>
      <ul className="space-y-3 md:hidden">{rows.map((row) => <li key={row.id} className="space-y-3 rounded-xl border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-semibold">{row.trackingCode ?? `Despacho #${row.id}`}</p><p className="text-sm text-muted-foreground">{row.recipient ?? "Sin nombre"}</p></div><Badge variant="outline">{LABELS[row.status]}</Badge></div><dl className="grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">Repartidor</dt><dd>{row.driverName ?? "—"}</dd></div><div><dt className="text-muted-foreground">Vehículo</dt><dd>{row.plate ?? "—"}</dd></div><div><dt className="text-muted-foreground">Partida</dt><dd>{dateTime(row.departedAt)}</dd></div><div><dt className="text-muted-foreground">Entrega</dt><dd>{dateTime(row.deliveredAt)}</dd></div></dl><Link className="inline-flex text-sm text-primary underline underline-offset-4" to={`/app/despachos/${row.id}`}>Abrir ficha 360°</Link></li>)}</ul>
      <PaginationControls page={page} totalPages={totalPages} total={query.data?.total} busy={query.isFetching} onPageChange={(next) => update({ page: String(next) })} />
    </>}
  </div>;
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
