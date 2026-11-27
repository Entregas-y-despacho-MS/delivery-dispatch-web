import { Eye } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { StatusBadge } from "@/shared/components/common/status-badge";
import { Button } from "@/shared/components/ui/button";
import {
  RESULTADOS_AUDITORIA,
  etiquetaAccion,
  etiquetaEntidad,
  etiquetaRol,
  formatearHoraAuditoria,
} from "../auditoria.reglas";
import type { EventoAuditoria, ResultadoAuditoria } from "../types/auditoria.types";

type Evento = EventoAuditoria & { id: string };

const TONO: Record<ResultadoAuditoria, "success" | "warning" | "destructive"> = {
  success: "success",
  denied: "warning",
  failed: "destructive",
};

export function ResultadoAuditoriaBadge({ resultado }: { resultado: ResultadoAuditoria }) {
  return <StatusBadge tone={TONO[resultado] ?? "muted"}>{RESULTADOS_AUDITORIA[resultado] ?? resultado}</StatusBadge>;
}

const actor = (e: EventoAuditoria) => (e.actorId === null ? "Sin sesión" : `Usuario #${e.actorId}`);
const objeto = (e: EventoAuditoria) => `${etiquetaEntidad(e.entityType)}${e.entityId ? ` #${e.entityId}` : ""}`;

interface AuditoriaTablaProps {
  eventos: EventoAuditoria[];
  loading?: boolean;
  filtrado?: boolean;
  onLimpiarFiltros?: () => void;
  onVerDetalle: (eventId: string) => void;
}

/** Eventos de auditoría (ST-70.2): hora con zona explícita, actor y rol, acción, objeto, resultado y correlación. */
export function AuditoriaTabla({ eventos, loading, filtrado = false, onLimpiarFiltros, onVerDetalle }: AuditoriaTablaProps) {
  const datos: Evento[] = eventos.map((e) => ({ ...e, id: e.eventId }));
  const botonDetalle = (e: Evento) => (
    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onVerDetalle(e.eventId)}
      aria-label={`Ver detalle del evento ${etiquetaAccion(e.action)} de ${formatearHoraAuditoria(e.occurredAt)}`} title="Ver detalle">
      <Eye aria-hidden />
    </Button>
  );
  const columns: Column<Evento>[] = [
    { header: "Fecha y hora", cell: (e) => <span className="text-sm tabular-nums">{formatearHoraAuditoria(e.occurredAt)}</span>, className: "w-[20%]" },
    {
      header: "Actor",
      cell: (e) => (
        <div className="space-y-0.5">
          <p className="font-medium">{actor(e)}</p>
          <p className="text-xs text-muted-foreground">{etiquetaRol(e.actorRole)}</p>
        </div>
      ),
      className: "w-[14%]",
    },
    { header: "Acción", cell: (e) => <span className="font-medium">{etiquetaAccion(e.action)}</span>, className: "w-[20%]" },
    { header: "Objeto", cell: (e) => <span className="text-sm">{objeto(e)}</span>, className: "w-[14%]" },
    { header: "Resultado", cell: (e) => <ResultadoAuditoriaBadge resultado={e.result} />, className: "w-[10%]" },
    { header: "Correlación", cell: (e) => <span className="font-mono text-xs break-all">{e.correlationId}</span>, className: "w-[16%]" },
    { header: "", cell: (e) => <div className="flex justify-end">{botonDetalle(e)}</div>, className: "w-[6%] text-right" },
  ];

  return (
    <ResponsiveList
      columns={columns}
      data={datos}
      loading={loading}
      isFiltered={filtrado}
      onClearFilters={onLimpiarFiltros}
      emptyTitle="Sin eventos"
      emptyMessage={filtrado ? "No hay eventos con esos filtros en el período." : "No hubo acciones administrativas en el período elegido."}
      mobileEmptyTitle="Sin eventos"
      mobileSkeletonCount={4}
      renderCard={(e) => (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{etiquetaAccion(e.action)}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{formatearHoraAuditoria(e.occurredAt)}</p>
            </div>
            <ResultadoAuditoriaBadge resultado={e.result} />
          </div>
          <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3 text-sm">
            <div>
              <p>{actor(e)} · {etiquetaRol(e.actorRole)}</p>
              <p className="text-muted-foreground">{objeto(e)}</p>
            </div>
            {botonDetalle(e)}
          </div>
        </article>
      )}
    />
  );
}
