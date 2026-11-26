import { Link } from "react-router-dom";

import { StatusBadge } from "@/shared/components/common/status-badge";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { useReporteProveedores } from "../hooks/use-reporte-proveedores";
import {
  CATEGORIAS,
  CAUSAS_ND_PROVEEDORES,
  CODIGOS_CATEGORIA,
  ESTADOS_RECOJO,
  EXCEPCIONES_POR_PAGINA,
  excepcionesPorGrupo,
  formatearMomento,
  formatearVentana,
  hayFiltrosProveedores,
  mensajeErrorProveedores,
  nombreProveedor,
  textoCumplimiento,
  volumenRecojos,
  type CumplimientoProveedores,
  type ExcepcionRecojo,
} from "../reportes.proveedores";
import { FiltroRangoFlota } from "./filtro-rango-flota";
import { IndicadorCard } from "./indicador-card";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TONO: Record<ExcepcionRecojo["category"], "destructive" | "warning" | "muted"> = {
  failed: "destructive",
  openOverdue: "warning",
  late: "warning",
  unknownTiming: "muted",
};

function Tarjetas({ datos }: { datos: CumplimientoProveedores }) {
  const { metrics: m, counts: c } = datos;
  return (
    <div className="space-y-3">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <IndicadorCard titulo="Cumplimiento en cita" valor={textoCumplimiento(m)} tamano="destacado"
          detalle={m.percentage === null ? CAUSAS_ND_PROVEEDORES[m.unavailableReason ?? ""] ?? "Sin citas vencidas con resultado." : `${m.numerator} / ${m.denominator} · n = ${m.n}`} />
        <IndicadorCard titulo="Volumen" valor={String(volumenRecojos(c))} detalle="recojos con cita en el período" />
        <IndicadorCard titulo="Pendientes" valor={String(c.pendingNotDue)} detalle="cita todavía por venir" />
        <IndicadorCard titulo="Excepciones" valor={String(datos.exceptionsTotal)} detalle="fallidos, vencidos, tarde o sin hora" tono={datos.exceptionsTotal > 0 ? "alerta" : undefined} />
      </dl>
      <ul className="grid gap-2 text-xs sm:grid-cols-4" aria-label="Recojos por categoría">
        {CODIGOS_CATEGORIA.map((codigo) => (
          <li key={codigo} className="flex justify-between rounded-md border px-2 py-1.5">
            <span>{CATEGORIAS[codigo].etiqueta}{CATEGORIAS[codigo].enTasa ? "" : " *"}</span>
            <span className="font-medium tabular-nums">{c[codigo]}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        * Fuera de la tasa. Se mide con la hora en que el transportista confirmó el recojo, contra la ventana vigente.
        {datos.rescheduledCount > 0 && ` ${datos.rescheduledCount} reprogramados (${datos.originalExpiredBeforeRescheduleCount} con la cita original ya vencida).`}
      </p>
    </div>
  );
}

function Grupos({ titulo, grupos }: { titulo: string; grupos: { grupo: string; cantidad: number }[] }) {
  return (
    <section className="space-y-1 rounded-lg border p-3" aria-label={titulo}>
      <h4 className="text-xs font-semibold">{titulo}</h4>
      {grupos.length === 0 ? <p className="text-xs text-muted-foreground">Sin excepciones.</p> : (
        <ul className="space-y-0.5 text-xs">
          {grupos.map(({ grupo, cantidad }) => (
            <li key={grupo} className="flex justify-between gap-2"><span>{grupo}</span><span className="tabular-nums">{cantidad}</span></li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Excepciones({ datos, pagina, onPagina, almacenes }: { datos: CumplimientoProveedores; pagina: number; onPagina: (p: number) => void; almacenes: Map<number, string> }) {
  const paginas = Math.max(1, Math.ceil(datos.exceptions.length / EXCEPCIONES_POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const visibles = datos.exceptions.slice((actual - 1) * EXCEPCIONES_POR_PAGINA, actual * EXCEPCIONES_POR_PAGINA);
  const almacen = (id: number | null) => (id === null ? "Almacén desconocido" : almacenes.get(id) ?? `Almacén #${id}`);
  if (datos.exceptions.length === 0) return <p className="text-sm text-muted-foreground">Sin excepciones en el período.</p>;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Grupos titulo="Excepciones por proveedor" grupos={excepcionesPorGrupo(datos.exceptions, nombreProveedor)} />
        <Grupos titulo="Excepciones por almacén destino" grupos={excepcionesPorGrupo(datos.exceptions, (e) => almacen(e.destinationWarehouseId))} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Excepciones de recojo">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-2 pr-3 font-medium">Recojo</th>
              <th className="py-2 pr-3 font-medium">Motivo</th>
              <th className="py-2 pr-3 font-medium">Proveedor · OC</th>
              <th className="py-2 pr-3 font-medium">Ventana vigente</th>
              <th className="py-2 font-medium">Recogido</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((e) => (
              <tr key={e.dispatchId} className="border-t align-top">
                <td className="py-2 pr-3">
                  <Link to={`/app/despachos/${e.dispatchId}`} className="font-medium text-primary hover:underline">#{e.dispatchId}</Link>
                  <span className="block text-xs text-muted-foreground">{ESTADOS_RECOJO[e.status] ?? e.status}</span>
                </td>
                <td className="py-2 pr-3"><StatusBadge tone={TONO[e.category]}>{CATEGORIAS[e.category].etiqueta}</StatusBadge></td>
                <td className="py-2 pr-3">{nombreProveedor(e)}<span className="block font-mono text-xs text-muted-foreground">{e.purchaseOrderRef}</span></td>
                <td className="py-2 pr-3 text-xs">
                  {formatearVentana(e.window)}
                  {e.originalWindow && <span className="block text-muted-foreground">Original: {formatearVentana(e.originalWindow)}</span>}
                </td>
                <td className="py-2 text-xs">{formatearMomento(e.custodyReceivedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {datos.exceptionsTotal > datos.exceptions.length && (
        <p className="text-xs text-muted-foreground">Se muestran las {datos.exceptions.length} más vencidas de {datos.exceptionsTotal}. Acota el período o filtra por proveedor.</p>
      )}
      {paginas > 1 && <PaginationControls page={actual} totalPages={paginas} onPageChange={onPagina} />}
    </div>
  );
}

/** Proveedores dentro del centro de Reportes (ST-305.2, ES-305): cumplimiento en cita, volumen, pendientes y excepciones. */
export function ReporteProveedoresPanel({ habilitado = true }: { habilitado?: boolean }) {
  const proveedores = useReporteProveedores({ habilitado });
  const { filtros, problema, reporte, almacenes, actualizar } = proveedores;
  const datos = reporte.data;
  const nombresAlmacen = new Map(almacenes.map((a) => [a.id, a.nombre]));

  return (
    <section className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="proveedores-titulo">
      <div className="space-y-1">
        <h2 id="proveedores-titulo" className="text-lg font-semibold text-brand-blue">Desempeño de proveedores</h2>
        <p className="text-sm text-muted-foreground">Recojos a proveedores por el fin de su ventana de cita (días de Bolivia).</p>
      </div>
      <div className="space-y-3 border-b pb-4">
        <FiltroRangoFlota desde={filtros.desde} onDesdeChange={proveedores.setDesde} hasta={filtros.hasta} onHastaChange={proveedores.setHasta}
          problemaRango={problema} onRefrescar={() => void reporte.refetch()} refrescando={reporte.isFetching} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="prov-proveedor" className="text-xs font-medium text-muted-foreground">Proveedor (ID de Compras)</label>
            <Input id="prov-proveedor" maxLength={64} placeholder="Ej.: SUP-001" value={filtros.proveedor} onChange={(e) => actualizar({ proveedor: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label htmlFor="prov-almacen" className="text-xs font-medium text-muted-foreground">Almacén destino</label>
            <select id="prov-almacen" className={CLASE_SELECT} value={filtros.almacen ?? ""} onChange={(e) => actualizar({ almacen: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Todos</option>
              {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="prov-estado" className="text-xs font-medium text-muted-foreground">Estado del recojo</label>
            <select id="prov-estado" className={CLASE_SELECT} value={filtros.estado ?? ""} onChange={(e) => actualizar({ estado: e.target.value || null })}>
              <option value="">Todos</option>
              {Object.entries(ESTADOS_RECOJO).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
          </div>
        </div>
        {hayFiltrosProveedores(filtros) && (
          <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={proveedores.limpiarFiltros}>Limpiar filtros</Button></div>
        )}
      </div>

      {problema !== null ? null : reporte.isError ? (
        <ErrorAlert title="No pudimos cargar los proveedores" error={reporte.error}
          description={mensajeErrorProveedores(parseApiError(reporte.error))}
          onRetry={() => reporte.refetch()} isRetrying={reporte.isFetching} />
      ) : !datos ? (
        <div className="space-y-3" role="status" aria-label="Cargando proveedores">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : datos.empty ? (
        <EmptyState title="Sin recojos en el período" description={hayFiltrosProveedores(filtros) ? "Ningún recojo coincide con esos filtros." : "No hay recojos a proveedores con cita en estas fechas."} />
      ) : (
        <div className={reporte.isPlaceholderData ? "space-y-5 opacity-60" : "space-y-5"} aria-busy={reporte.isFetching}>
          <Tarjetas datos={datos} />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Excepciones <span className="font-normal text-muted-foreground">(las más vencidas primero)</span></h3>
            <Excepciones datos={datos} pagina={filtros.pagina} onPagina={proveedores.setPagina} almacenes={nombresAlmacen} />
          </div>
        </div>
      )}
    </section>
  );
}
