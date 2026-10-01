import { Pencil, Power, Timer } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import type { NivelServicio } from "../catalogos.types";

function PriorityBadge({ priorityLevel }: { priorityLevel: number }) {
  return (
    <Badge variant="secondary" className="tabular-nums">
      Prioridad {priorityLevel}{priorityLevel === 1 ? " · más alta" : ""}
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

function NivelActions({
  nivel,
  onEdit,
  busy,
}: {
  nivel: NivelServicio;
  onEdit: (nivel: NivelServicio) => void;
  busy: boolean;
}) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" disabled={busy}
      onClick={() => onEdit(nivel)} aria-label={`Editar ${nivel.name}`} title="Editar">
      <Pencil aria-hidden />
    </Button>
  );
}

export function NivelesServicioTable({
  data,
  loading = false,
  searchActive = false,
  onEdit,
  onToggle,
  busy = false,
}: {
  data: NivelServicio[];
  loading?: boolean;
  searchActive?: boolean;
  onEdit: (nivel: NivelServicio) => void;
  onToggle: (nivel: NivelServicio) => void;
  busy?: boolean;
}) {
  const columns: Column<NivelServicio>[] = [
    {
      header: "Nivel de servicio",
      cell: (nivel) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium">{nivel.name}</p>
          <p className="max-w-[28rem] truncate text-xs text-muted-foreground">{nivel.description || "Sin descripción"}</p>
        </div>
      ),
      className: "w-[34%]",
    },
    {
      header: "Tiempo objetivo",
      cell: (nivel) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
          <Timer className="size-4" aria-hidden />
          {nivel.targetTimeMin} min
        </span>
      ),
      className: "w-[20%]",
    },
    {
      header: "Prioridad",
      cell: (nivel) => <PriorityBadge priorityLevel={nivel.priorityLevel} />,
      className: "w-[16%]",
    },
    {
      header: "Estado",
      cell: (nivel) => <StatusBadge active={nivel.active} />,
      className: "w-[18%]",
    },
    {
      header: "Acciones",
      cell: (nivel) => (
        <div className="flex items-center justify-end gap-2">
          <NivelActions nivel={nivel} onEdit={onEdit} busy={busy} />
          <Switch checked={nivel.active} disabled={busy} onCheckedChange={() => onToggle(nivel)} aria-label={`${nivel.active ? "Desactivar" : "Activar"} ${nivel.name}`} />
        </div>
      ),
      className: "w-[12%] text-right",
    },
  ];

  return (
    <ResponsiveList
      columns={columns} data={data} loading={loading}
      emptyMessage={searchActive ? "No encontramos niveles con ese criterio." : "Crea el primer nivel para comenzar a priorizar tus despachos."}
      renderCard={(nivel) => (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h3 className="truncate font-semibold">{nivel.name}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{nivel.description || "Sin descripción"}</p>
            </div>
            <NivelActions nivel={nivel} onEdit={onEdit} busy={busy} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Tiempo objetivo</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-medium tabular-nums"><Timer className="size-4 text-muted-foreground" aria-hidden />{nivel.targetTimeMin} min</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prioridad</p>
              <div className="mt-1"><PriorityBadge priorityLevel={nivel.priorityLevel} /></div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <StatusBadge active={nivel.active} />
            <Switch checked={nivel.active} disabled={busy} onCheckedChange={() => onToggle(nivel)} aria-label={`${nivel.active ? "Desactivar" : "Activar"} ${nivel.name}`} />
          </div>
        </article>
      )}
    />
  );
}
