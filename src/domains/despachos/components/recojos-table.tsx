import { Ban } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { etiquetaEstadoDespacho, formatearFechaTurnoDetalle } from "../despacho-detalle.format";
import { ETIQUETA_ORIGEN, sePuedeAnular } from "../recojos.reglas";
import type { OrigenRecojo, Recojo } from "../types/recojos.types";
import { ResultadoRecepcionBadge } from "./resultado-recepcion-badge";

function OrigenBadge({ origen }: { origen: OrigenRecojo }) {
  return (
    <span className={cn(
      "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold",
      origen === "rma" ? "bg-brand-blue/10 text-brand-blue dark:text-brand-turquoise" : "bg-muted text-muted-foreground",
    )}>
      {ETIQUETA_ORIGEN[origen]}
    </span>
  );
}

function EstadoRecojo({ estado }: { estado: string }) {
  return (
    <span className={cn(
      "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
      estado === "cancelled" ? "bg-destructive/10 text-destructive"
        : estado === "returned_to_warehouse" ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning",
    )}>
      {etiquetaEstadoDespacho(estado)}
    </span>
  );
}

/** Estado del recojo y, debajo, el resultado de la recepción en almacén cuando ya la hay (ST-240.5). */
function EstadoConRecepcion({ recojo, className }: { recojo: Recojo; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <EstadoRecojo estado={recojo.status} />
      {recojo.receiptResult && <ResultadoRecepcionBadge resultado={recojo.receiptResult} />}
    </div>
  );
}

const fechaPreferida =(recojo: Recojo) => (recojo.preferredPickupDate ? formatearFechaTurnoDetalle(recojo.preferredPickupDate) : "—");

function BotonAnular({ recojo, onAnular }: { recojo: Recojo; onAnular?: (recojo: Recojo) => void }) {
  if (!onAnular || !sePuedeAnular(recojo.status)) return null;
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => onAnular(recojo)}
      aria-label={`Anular el recojo ${recojo.trackingCode ?? recojo.sourceOrderRef}`}>
      <Ban aria-hidden /> Anular
    </Button>
  );
}

interface RecojosTableProps {
  data: Recojo[];
  loading?: boolean;
  filtrado?: boolean;
  onLimpiarFiltros?: () => void;
  /** Sin esta función (supervisor) no se muestra «Anular». */
  onAnular?: (recojo: Recojo) => void;
}

/** Listado de recojos (ST-81.1): «Anular» solo en los estados que el back permite. */
export function RecojosTable({ data, loading, filtrado = false, onLimpiarFiltros, onAnular }: RecojosTableProps) {
  const columns: Column<Recojo>[] = [
    {
      header: "Recojo",
      cell: (r) => (
        <div className="space-y-1">
          <p className="font-mono text-sm font-medium">{r.trackingCode ?? "Sin código"}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <OrigenBadge origen={r.origin} />
            <span className="text-xs text-muted-foreground">{r.sourceOrderRef}</span>
          </div>
        </div>
      ),
      className: "w-[17%]",
    },
    {
      header: "Cliente",
      cell: (r) => (
        <div className="space-y-0.5">
          <p className="font-medium">{r.contactName ?? "Sin nombre"}</p>
          {r.contactPhone && <p className="text-xs text-muted-foreground">{r.contactPhone}</p>}
        </div>
      ),
      className: "w-[16%]",
    },
    { header: "Dirección", cell: (r) => <p className="line-clamp-2 text-sm" title={r.address}>{r.address}</p>, className: "w-[22%]" },
    { header: "Motivo", cell: (r) => <p className="line-clamp-2 text-sm">{r.returnReason ?? "—"}</p>, className: "w-[12%]" },
    { header: "Almacén destino", cell: (r) => <p className="line-clamp-2 text-sm">{r.destinationWarehouse?.name ?? "—"}</p>, className: "w-[14%]" },
    {
      header: "Qué se recoge",
      cell: (r) => (
        <div className="space-y-0.5">
          <p className="line-clamp-2 text-sm" title={r.packageContents ?? undefined}>{r.packageContents ?? "—"}</p>
          {r.estimatedBoxes !== null && <p className="text-xs text-muted-foreground">{r.estimatedBoxes} caja{r.estimatedBoxes === 1 ? "" : "s"}</p>}
        </div>
      ),
      className: "w-[16%]",
    },
    { header: "Fecha", cell: (r) => <span className="text-sm tabular-nums">{fechaPreferida(r)}</span>, className: "w-[9%]" },
    { header: "Estado", cell: (r) => <EstadoConRecepcion recojo={r} />, className: "w-[11%]" },
    {
      header: "",
      cell: (r) => <div className="flex justify-end"><BotonAnular recojo={r} onAnular={onAnular} /></div>,
      className: "w-[9%] text-right",
    },
  ];

  return (
    <ResponsiveList
      columns={columns}
      data={data}
      loading={loading}
      isFiltered={filtrado}
      onClearFilters={onLimpiarFiltros}
      emptyMessage={filtrado ? "No hay recojos con esos filtros." : "Todavía no hay órdenes de recojo."}
      mobileSkeletonCount={4}
      renderCard={(r) => (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-sm font-semibold">{r.trackingCode ?? "Sin código"}</p>
              <OrigenBadge origen={r.origin} />
            </div>
            <EstadoConRecepcion recojo={r} className="items-end" />
          </div>
          <p className="mt-3 text-sm font-medium">{r.contactName ?? "Sin nombre"}</p>
          <p className="text-sm text-muted-foreground">{r.address}</p>
          <p className="mt-1 text-xs">Motivo: {r.returnReason ?? "—"} · Almacén: {r.destinationWarehouse?.name ?? "—"}</p>
          <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3">
            <div className="text-xs">
              <p>Fecha: {fechaPreferida(r)}</p>
              {r.packageContents && <p className="text-muted-foreground">{r.packageContents}</p>}
            </div>
            <BotonAnular recojo={r} onAnular={onAnular} />
          </div>
        </article>
      )}
    />
  );
}
