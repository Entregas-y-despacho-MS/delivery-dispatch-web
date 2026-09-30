import { Camera, CameraOff, Pencil, Power } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import type { MotivoIncidencia } from "../catalogos.types";

/** Indicador visual del requisito de foto que la app móvil aplica al reportar la incidencia. */
function EvidenciaBadge({ requiresEvidence }: { requiresEvidence: boolean }) {
  return requiresEvidence ? (
    <Badge variant="outline" className="border-brand-turquoise/30 bg-brand-soft text-brand-blue">
      <Camera aria-hidden /> Foto obligatoria
    </Badge>
  ) : (
    <Badge variant="outline" className="border-muted-foreground/20 bg-muted text-muted-foreground">
      <CameraOff aria-hidden /> Foto opcional
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

function EditButton({ motivo, onEdit, busy }: { motivo: MotivoIncidencia; onEdit: (motivo: MotivoIncidencia) => void; busy: boolean }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" disabled={busy} onClick={() => onEdit(motivo)} aria-label={`Editar ${motivo.name}`}>
      <Pencil aria-hidden />
    </Button>
  );
}

export function MotivosIncidenciaTable({
  data,
  loading = false,
  searchActive = false,
  onEdit,
  onToggle,
  busy = false,
}: {
  data: MotivoIncidencia[];
  loading?: boolean;
  searchActive?: boolean;
  onEdit: (motivo: MotivoIncidencia) => void;
  onToggle: (motivo: MotivoIncidencia) => void;
  busy?: boolean;
}) {
  const emptyMessage = searchActive
    ? "No encontramos motivos con ese criterio."
    : "Crea el primer motivo para que los repartidores puedan reportar incidencias.";

  const columns: Column<MotivoIncidencia>[] = [
    {
      header: "Motivo",
      cell: (motivo) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium">{motivo.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{motivo.code}</p>
        </div>
      ),
      className: "w-[40%]",
    },
    {
      header: "Evidencia",
      cell: (motivo) => <EvidenciaBadge requiresEvidence={motivo.requiresEvidence} />,
      className: "w-[24%]",
    },
    {
      header: "Estado",
      cell: (motivo) => (
        <div className="flex items-center gap-3">
          <Switch checked={motivo.active} disabled={busy} onCheckedChange={() => onToggle(motivo)} aria-label={`${motivo.active ? "Desactivar" : "Activar"} ${motivo.name}`} />
          <StatusBadge active={motivo.active} />
        </div>
      ),
      className: "w-[24%]",
    },
    {
      header: "",
      cell: (motivo) => <EditButton motivo={motivo} onEdit={onEdit} busy={busy} />,
      className: "w-12 text-right",
    },
  ];

  return (
    <ResponsiveList
      columns={columns} data={data} loading={loading} emptyMessage={emptyMessage}
      renderCard={(motivo) => (
        <article className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h3 className="truncate font-semibold">{motivo.name}</h3>
              <p className="truncate font-mono text-xs text-muted-foreground">{motivo.code}</p>
            </div>
            <EditButton motivo={motivo} onEdit={onEdit} busy={busy} />
          </div>
          <div className="mt-3 border-t pt-3">
            <EvidenciaBadge requiresEvidence={motivo.requiresEvidence} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <StatusBadge active={motivo.active} />
            <Switch checked={motivo.active} disabled={busy} onCheckedChange={() => onToggle(motivo)} aria-label={`${motivo.active ? "Desactivar" : "Activar"} ${motivo.name}`} />
          </div>
        </article>
      )}
    />
  );
}
