import { Eye } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { StatusBadge } from "@/shared/components/common/status-badge";
import { Button } from "@/shared/components/ui/button";
import { antiguedad, estadoVisible, etiquetaSiguienteAccion, formatearFechaReclamo } from "../reclamos.reglas";
import type { EstadoReclamo, Reclamo } from "../types/reclamos.types";

type Fila = Reclamo & { id: number };

const TONO: Record<EstadoReclamo, "info" | "warning" | "success" | "muted"> = {
  received: "warning",
  assigned: "info",
  in_investigation: "info",
  decided: "success",
};

export function EstadoReclamoBadge({ reclamo }: { reclamo: Pick<Reclamo, "investigationStatus" | "authorizationPending"> }) {
  const tono = reclamo.investigationStatus === "decided" && reclamo.authorizationPending ? "warning" : TONO[reclamo.investigationStatus] ?? "muted";
  return <StatusBadge tone={tono}>{estadoVisible(reclamo)}</StatusBadge>;
}

const despacho = (r: Reclamo) => r.trackingCode ?? `Despacho #${r.dispatchId}`;
const responsable = (r: Reclamo) => r.assignedUserName ?? "Sin asignar";

interface ReclamosTablaProps {
  reclamos: Reclamo[];
  loading?: boolean;
  filtrado?: boolean;
  /** Referencia de la antigüedad (p. ej. cuándo llegó la bandeja). */
  ahora: number;
  onLimpiarFiltros?: () => void;
  onVerDetalle: (id: number) => void;
}

/** Bandeja (ST-45.3): caso del CRM, despacho, estado, motivo, antigüedad, responsable y siguiente acción. */
export function ReclamosTabla({ reclamos, loading, filtrado = false, ahora, onLimpiarFiltros, onVerDetalle }: ReclamosTablaProps) {
  const filas: Fila[] = reclamos.map((r) => ({ ...r, id: r.complaintId }));
  const boton = (r: Fila) => (
    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onVerDetalle(r.complaintId)}
      aria-label={`Ver reclamo ${r.crmCaseId}`} title="Ver detalle">
      <Eye aria-hidden />
    </Button>
  );
  const columns: Column<Fila>[] = [
    {
      header: "Caso CRM",
      cell: (r) => (
        <div className="space-y-0.5">
          <p className="font-mono text-sm font-medium">{r.crmCaseId}</p>
          <p className="text-xs text-muted-foreground">{despacho(r)}</p>
        </div>
      ),
      className: "w-[18%]",
    },
    { header: "Estado", cell: (r) => <EstadoReclamoBadge reclamo={r} />, className: "w-[14%]" },
    { header: "Motivo", cell: (r) => <span className="font-mono text-xs">{r.reasonCode}</span>, className: "w-[14%]" },
    {
      header: "Antigüedad",
      cell: (r) => <span className="text-sm tabular-nums" title={formatearFechaReclamo(r.receivedAt)}>{antiguedad(r.receivedAt, ahora)}</span>,
      className: "w-[11%]",
    },
    { header: "Zona", cell: (r) => <span className="text-sm">{r.zoneName ?? "—"}</span>, className: "w-[11%]" },
    { header: "Responsable", cell: (r) => <span className="text-sm">{responsable(r)}</span>, className: "w-[13%]" },
    {
      header: "Siguiente acción",
      cell: (r) => <span className={r.nextAction === "none" ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{etiquetaSiguienteAccion(r.nextAction)}</span>,
      className: "w-[14%]",
    },
    { header: "", cell: (r) => <div className="flex justify-end">{boton(r)}</div>, className: "w-[5%] text-right" },
  ];

  return (
    <ResponsiveList
      columns={columns}
      data={filas}
      loading={loading}
      isFiltered={filtrado}
      onClearFilters={onLimpiarFiltros}
      emptyTitle="Sin reclamos"
      emptyMessage={filtrado ? "No hay reclamos con esos filtros." : "Todavía no llegó ningún reclamo del CRM."}
      mobileEmptyTitle="Sin reclamos"
      mobileSkeletonCount={4}
      renderCard={(r) => (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-mono font-medium">{r.crmCaseId}</p>
              <p className="text-xs text-muted-foreground">{despacho(r)} · {antiguedad(r.receivedAt, ahora)}</p>
            </div>
            <EstadoReclamoBadge reclamo={r} />
          </div>
          <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3 text-sm">
            <div>
              <p>{responsable(r)}</p>
              <p className="text-muted-foreground">{etiquetaSiguienteAccion(r.nextAction)}</p>
            </div>
            {boton(r)}
          </div>
        </article>
      )}
    />
  );
}
