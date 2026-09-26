import { MoreHorizontal, Pencil, Power, Timer, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/shared/components/common/data-table";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Skeleton } from "@/shared/components/ui/skeleton";
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
  onDelete,
  busy,
}: {
  nivel: NivelServicio;
  onEdit: (nivel: NivelServicio) => void;
  onDelete: (nivel: NivelServicio) => void;
  busy: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" disabled={busy} aria-label={`Acciones de ${nivel.name}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(nivel)}><Pencil aria-hidden /> Editar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(nivel)}><Trash2 aria-hidden /> Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NivelesServicioTable({
  data,
  loading = false,
  searchActive = false,
  onEdit,
  onToggle,
  onDelete,
  busy = false,
}: {
  data: NivelServicio[];
  loading?: boolean;
  searchActive?: boolean;
  onEdit: (nivel: NivelServicio) => void;
  onToggle: (nivel: NivelServicio) => void;
  onDelete: (nivel: NivelServicio) => void;
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
      className: "w-[36%]",
    },
    {
      header: "Tiempo objetivo",
      cell: (nivel) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
          <Timer className="size-4" aria-hidden />
          {nivel.targetTimeMin} min
        </span>
      ),
      className: "w-[22%]",
    },
    {
      header: "Prioridad",
      cell: (nivel) => <PriorityBadge priorityLevel={nivel.priorityLevel} />,
      className: "w-[16%]",
    },
    {
      header: "Estado",
      cell: (nivel) => (
        <div className="flex items-center gap-3">
          <Switch checked={nivel.active} disabled={busy} onCheckedChange={() => onToggle(nivel)} aria-label={`${nivel.active ? "Desactivar" : "Activar"} ${nivel.name}`} />
          <StatusBadge active={nivel.active} />
        </div>
      ),
      className: "w-[20%]",
    },
    {
      header: "",
      cell: (nivel) => <NivelActions nivel={nivel} onEdit={onEdit} onDelete={onDelete} busy={busy} />,
      className: "w-12 text-right",
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage={searchActive ? "No encontramos niveles con ese criterio." : "Crea el primer nivel para comenzar a priorizar tus despachos."}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {loading && Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}

        {!loading && data.length === 0 && (
          <EmptyState
            title="Sin resultados"
            description={searchActive ? "No encontramos niveles con ese criterio." : "Crea el primer nivel para comenzar a priorizar tus despachos."}
          />
        )}

        {!loading && data.map((nivel) => (
          <article key={nivel.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <h3 className="truncate font-semibold">{nivel.name}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{nivel.description || "Sin descripción"}</p>
              </div>
              <NivelActions nivel={nivel} onEdit={onEdit} onDelete={onDelete} busy={busy} />
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
        ))}
      </div>
    </>
  );
}
