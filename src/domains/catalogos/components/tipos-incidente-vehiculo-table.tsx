import { Ban, CircleCheck, Pencil } from "lucide-react";

import { DataTable, type Column } from "@/shared/components/common/data-table";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { TipoIncidenteVehiculo } from "../catalogos.types";
import { getSeveridadIncidenteVehiculo } from "../tipos-incidente-vehiculo.constants";

function SeveridadBadge({ tipo }: { tipo: TipoIncidenteVehiculo }) {
  const severity = getSeveridadIncidenteVehiculo(tipo.severity);
  return <Badge variant="outline" className={severity.badgeClassName}>{severity.label}</Badge>;
}

function BloqueoBadge({ disabled }: { disabled: boolean }) {
  return (
    <Badge variant="outline" className={disabled
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : "border-success/20 bg-success/10 text-success"}>
      {disabled ? <Ban aria-hidden /> : <CircleCheck aria-hidden />}
      {disabled ? "Sí, bloquea" : "No bloquea"}
    </Badge>
  );
}

function EditButton({ tipo, onEdit }: { tipo: TipoIncidenteVehiculo; onEdit: (tipo: TipoIncidenteVehiculo) => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(tipo)}
      aria-label={`Editar ${tipo.name}`}>
      <Pencil aria-hidden />
    </Button>
  );
}

interface TiposIncidenteVehiculoTableProps {
  data: TipoIncidenteVehiculo[];
  onEdit: (tipo: TipoIncidenteVehiculo) => void;
  loading?: boolean;
  unavailable?: boolean;
}

export function TiposIncidenteVehiculoTable({
  data,
  onEdit,
  loading = false,
  unavailable = false,
}: TiposIncidenteVehiculoTableProps) {
  const emptyMessage = unavailable
    ? "Los tipos de falla se mostrarán cuando el servicio esté disponible."
    : "Crea el primer tipo de falla para clasificar los incidentes de flota.";

  const columns: Column<TipoIncidenteVehiculo>[] = [
    { header: "Código", cell: (tipo) => <span className="font-mono text-xs">{tipo.code}</span>, className: "w-[19%]" },
    {
      header: "Descripción del incidente",
      cell: (tipo) => (
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{tipo.name}</p>
          {!tipo.active && <span className="text-xs text-muted-foreground">Inactivo</span>}
        </div>
      ),
      className: "w-[34%]",
    },
    { header: "Severidad", cell: (tipo) => <SeveridadBadge tipo={tipo} />, className: "w-[17%]" },
    { header: "Bloquea unidad", cell: (tipo) => <BloqueoBadge disabled={tipo.disablesVehicle} />, className: "w-[22%]" },
    { header: "Acciones", cell: (tipo) => <EditButton tipo={tipo} onEdit={onEdit} />, className: "w-[8%] text-right" },
  ];

  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={columns} data={data} loading={loading}
          emptyTitle={unavailable ? "Catálogo en preparación" : "Sin tipos de falla"}
          emptyMessage={emptyMessage} />
      </div>

      <div className="space-y-3 md:hidden">
        {loading && Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ))}
        {!loading && data.length === 0 && (
          <EmptyState title={unavailable ? "Catálogo en preparación" : "Sin tipos de falla"}
            description={emptyMessage} />
        )}
        {!loading && data.map((tipo) => (
          <article key={tipo.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-xs text-muted-foreground">{tipo.code}</p>
                <h3 className="font-semibold">{tipo.name}</h3>
                {!tipo.active && <p className="text-xs text-muted-foreground">Inactivo</p>}
              </div>
              <EditButton tipo={tipo} onEdit={onEdit} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
              <SeveridadBadge tipo={tipo} />
              <BloqueoBadge disabled={tipo.disablesVehicle} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
