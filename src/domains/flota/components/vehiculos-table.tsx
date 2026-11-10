import { Link } from "react-router-dom";
import { Pencil, Power, Wrench } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { StatusBadge } from "@/shared/components/common/status-badge";
import { Button } from "@/shared/components/ui/button";
import type { EstadoVehiculo, Vehiculo } from "../types/flota.types";

/**
 * Mapeo de estados reales del backend (active | maintenance | out_of_service, en inglés)
 * a las etiquetas y colores pedidos en ST-22.2: Verde=Disponible, Naranja=Mantenimiento.
 * "out_of_service" no está en el ticket original; se muestra en rojo por ser el más crítico.
 */
const ESTADO_BADGE: Record<string, { label: string; tone: "success" | "warning" | "destructive" }> = {
  active: { label: "Disponible", tone: "success" },
  maintenance: { label: "Mantenimiento", tone: "warning" },
  out_of_service: { label: "Fuera de servicio", tone: "destructive" },
};

function EstadoBadge({ estado }: { estado: EstadoVehiculo }) {
  const config = ESTADO_BADGE[estado.name] ?? { label: estado.name, tone: "muted" as const };
  return (
    <StatusBadge tone={config.tone} bordered={false}>
      {config.label}
    </StatusBadge>
  );
}

export function VehiculosTable({
  data,
  loading,
  onEdit,
  onChangeStatus,
  hrefMantenimientos,
  searchActive = false,
}: {
  data: Vehiculo[];
  loading?: boolean;
  onEdit: (vehiculo: Vehiculo) => void;
  onChangeStatus: (vehiculo: Vehiculo) => void;
  /** Enlace al historial de mantenimientos del vehículo (ST-64.2); sin él no se muestra el botón. */
  hrefMantenimientos?: (vehiculo: Vehiculo) => string;
  searchActive?: boolean;
}) {
  const botonMantenimientos = (vehiculo: Vehiculo) => hrefMantenimientos && (
    <Button asChild variant="ghost" size="icon-sm" title="Mantenimientos">
      <Link to={hrefMantenimientos(vehiculo)} aria-label={`Mantenimientos de ${vehiculo.plate}`}>
        <Wrench aria-hidden />
      </Link>
    </Button>
  );

  const columns: Column<Vehiculo>[] = [
    {
      header: "Placa",
      cell: (vehiculo) => <span className="font-mono font-medium tracking-tight">{vehiculo.plate}</span>,
      className: "w-[15%]",
    },
    {
      header: "Tipo",
      cell: (vehiculo) => <span className="font-medium">{vehiculo.type}</span>,
      className: "w-[17%]",
    },
    {
      header: "Modelo",
      cell: "model",
      className: "w-[20%]",
    },
    {
      header: "Capacidad (kg)",
      cell: (vehiculo) => <span className="tabular-nums">{vehiculo.capacityKg} kg</span>,
      className: "w-[14%] text-right",
    },
    {
      header: "Capacidad (m³)",
      cell: (vehiculo) => <span className="tabular-nums">{vehiculo.capacityM3} m³</span>,
      className: "w-[14%] text-right",
    },
    {
      header: "Estado",
      cell: (vehiculo) => <EstadoBadge estado={vehiculo.vehicleStatus} />,
      className: "w-[12%]",
    },
    {
      header: "",
      cell: (vehiculo) => (
        <div className="flex justify-end gap-1">
          {botonMantenimientos(vehiculo)}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChangeStatus(vehiculo)}
            aria-label={`Cambiar estado de ${vehiculo.plate}`}
            title="Cambiar estado"
          >
            <Power aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(vehiculo)}
            aria-label={`Editar ${vehiculo.plate}`}
            title="Editar vehículo"
          >
            <Pencil aria-hidden />
          </Button>
        </div>
      ),
      className: "w-32 text-right",
    },
  ];

  return (
    <ResponsiveList
      columns={columns} data={data} loading={loading}
      emptyMessage={searchActive ? "No encontramos vehículos con ese criterio." : "Registra el primer vehículo para comenzar a gestionar la flota."}
      mobileSkeletonCount={4}
      renderCard={(vehiculo) => (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-sm font-semibold tracking-tight">{vehiculo.plate}</p>
              <h3 className="truncate font-medium">{vehiculo.type} · {vehiculo.model}</h3>
            </div>
            <div className="flex gap-1">
              {botonMantenimientos(vehiculo)}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChangeStatus(vehiculo)}
                aria-label={`Cambiar estado de ${vehiculo.plate}`}
                title="Cambiar estado"
              >
                <Power aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(vehiculo)}
                aria-label={`Editar ${vehiculo.plate}`}
                title="Editar vehículo"
              >
                <Pencil aria-hidden />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t pt-3">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div>
                <p>Peso</p>
                <p className="tabular-nums font-medium text-foreground">{vehiculo.capacityKg} kg</p>
              </div>
              <div>
                <p>Volumen</p>
                <p className="tabular-nums font-medium text-foreground">{vehiculo.capacityM3} m³</p>
              </div>
            </div>
            <EstadoBadge estado={vehiculo.vehicleStatus} />
          </div>
        </article>
      )}
    />
  );
}
