import { Ban, CircleCheck, Pencil } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
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

function EditButton({ tipo, onEdit, busy }: {
  tipo: TipoIncidenteVehiculo;
  onEdit: (tipo: TipoIncidenteVehiculo) => void;
  busy: boolean;
}) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" disabled={busy} onClick={() => onEdit(tipo)}
      aria-label={`Editar ${tipo.name}`}>
      <Pencil aria-hidden />
    </Button>
  );
}

interface TiposIncidenteVehiculoTableProps {
  data: TipoIncidenteVehiculo[];
  onEdit: (tipo: TipoIncidenteVehiculo) => void;
  loading?: boolean;
  searchActive?: boolean;
  onClearFilters?: () => void;
  busy?: boolean;
}

export function TiposIncidenteVehiculoTable({
  data,
  onEdit,
  loading = false,
  searchActive = false,
  onClearFilters,
  busy = false,
}: TiposIncidenteVehiculoTableProps) {
  const emptyMessage = searchActive
    ? "No encontramos tipos de falla con esos criterios."
    : "Crea el primer tipo de falla para clasificar los incidentes de flota.";

  const columns: Column<TipoIncidenteVehiculo>[] = [
    { header: "Código", cell: (tipo) => <span className="font-mono text-xs">{tipo.code}</span>, className: "w-[19%]" },
    {
      header: "Descripción del incidente",
      cell: (tipo) => (
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{tipo.name}</p>
        </div>
      ),
      className: "w-[34%]",
    },
    { header: "Severidad", cell: (tipo) => <SeveridadBadge tipo={tipo} />, className: "w-[17%]" },
    { header: "Bloquea unidad", cell: (tipo) => <BloqueoBadge disabled={tipo.disablesVehicle} />, className: "w-[22%]" },
    { header: "Acciones", cell: (tipo) => <EditButton tipo={tipo} onEdit={onEdit} busy={busy} />, className: "w-[8%] text-right" },
  ];

  return (
    <ResponsiveList
      columns={columns} data={data} loading={loading}
      emptyTitle={searchActive ? "Sin resultados" : "Sin tipos de falla"}
      emptyMessage={emptyMessage} isFiltered={searchActive} onClearFilters={onClearFilters}
      mobileFilteredState mobileEmptyTitle="Sin tipos de falla" mobileSkeletonVariant="incident"
      renderCard={(tipo) => (
        <article className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-xs text-muted-foreground">{tipo.code}</p>
              <h3 className="font-semibold">{tipo.name}</h3>
            </div>
            <EditButton tipo={tipo} onEdit={onEdit} busy={busy} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
            <SeveridadBadge tipo={tipo} />
            <BloqueoBadge disabled={tipo.disablesVehicle} />
          </div>
        </article>
      )}
    />
  );
}
