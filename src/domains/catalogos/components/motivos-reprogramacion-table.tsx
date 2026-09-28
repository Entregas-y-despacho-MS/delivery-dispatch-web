import { Gauge, Pencil, Power } from "lucide-react";

import { DataTable, type Column } from "@/shared/components/common/data-table";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import type { MotivoReprogramacion } from "../catalogos.types";
import { getMotivoReprogramacionCategoria } from "../motivos-reprogramacion.constants";

function OriginBadge({ motivo }: { motivo: MotivoReprogramacion }) {
  const origin = getMotivoReprogramacionCategoria(motivo.category);
  return <Badge variant="outline" className={origin.badgeClassName}>{origin.label}</Badge>;
}

function PuntualidadBadge({ excluded }: { excluded: boolean }) {
  return (
    <Badge variant="outline" className={excluded
      ? "border-info/20 bg-info/10 text-info"
      : "border-muted-foreground/20 bg-muted text-muted-foreground"}>
      <Gauge aria-hidden /> {excluded ? "No cuenta en la métrica" : "Cuenta en la métrica"}
    </Badge>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
      <Power aria-hidden /> Activo
    </Badge>
  ) : (
    <Badge variant="outline" className="border-muted-foreground/20 bg-muted text-muted-foreground">
      Inactivo
    </Badge>
  );
}

function EditButton({ motivo, onEdit, busy }: {
  motivo: MotivoReprogramacion;
  onEdit: (motivo: MotivoReprogramacion) => void;
  busy: boolean;
}) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" disabled={busy}
      onClick={() => onEdit(motivo)} aria-label={`Editar ${motivo.name}`}>
      <Pencil aria-hidden />
    </Button>
  );
}

export function MotivosReprogramacionTable({ data, loading = false, searchActive = false, onClearFilters, onEdit, onToggle, busy = false }: {
  data: MotivoReprogramacion[];
  loading?: boolean;
  searchActive?: boolean;
  onClearFilters?: () => void;
  onEdit: (motivo: MotivoReprogramacion) => void;
  onToggle: (motivo: MotivoReprogramacion) => void;
  busy?: boolean;
}) {
  const emptyMessage = searchActive
    ? "No encontramos motivos con ese criterio."
    : "Crea el primer motivo para registrar cambios de fecha o transportista.";

  const columns: Column<MotivoReprogramacion>[] = [
    {
      header: "Motivo",
      cell: (motivo) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium">{motivo.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{motivo.code}</p>
          {motivo.description && <p className="max-w-[25rem] truncate text-xs text-muted-foreground" title={motivo.description}>{motivo.description}</p>}
        </div>
      ),
      className: "w-[34%]",
    },
    { header: "Origen", cell: (motivo) => <OriginBadge motivo={motivo} />, className: "w-[20%]" },
    { header: "Puntualidad", cell: (motivo) => <PuntualidadBadge excluded={motivo.affectsSla} />, className: "w-[20%]" },
    {
      header: "Estado",
      cell: (motivo) => (
        <div className="flex items-center gap-3">
          <Switch checked={motivo.active} disabled={busy} onCheckedChange={() => onToggle(motivo)}
            aria-label={`${motivo.active ? "Desactivar" : "Activar"} ${motivo.name}`} />
          <StatusBadge active={motivo.active} />
        </div>
      ),
      className: "w-[20%]",
    },
    {
      header: "",
      cell: (motivo) => <EditButton motivo={motivo} onEdit={onEdit} busy={busy} />,
      className: "w-12 text-right",
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={columns} data={data} loading={loading} emptyMessage={emptyMessage}
          isFiltered={searchActive} onClearFilters={onClearFilters} />
      </div>
      <div className="space-y-3 md:hidden">
        {loading && Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        {!loading && data.length === 0 && (searchActive
          ? <NoResultsState description={emptyMessage} onClearFilters={onClearFilters} bordered />
          : <EmptyState title="Sin motivos todavía" description={emptyMessage} />)}
        {!loading && data.map((motivo) => (
          <article key={motivo.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold">{motivo.name}</h3>
                <p className="font-mono text-xs text-muted-foreground">{motivo.code}</p>
              </div>
              <EditButton motivo={motivo} onEdit={onEdit} busy={busy} />
            </div>
            {motivo.description && <p className="mt-2 text-sm text-muted-foreground">{motivo.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              <OriginBadge motivo={motivo} />
              <PuntualidadBadge excluded={motivo.affectsSla} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <StatusBadge active={motivo.active} />
              <Switch checked={motivo.active} disabled={busy} onCheckedChange={() => onToggle(motivo)}
                aria-label={`${motivo.active ? "Desactivar" : "Activar"} ${motivo.name}`} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
