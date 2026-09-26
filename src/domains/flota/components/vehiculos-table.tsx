import { Pencil, Search } from "lucide-react";

import { DataTable, type Column } from "@/shared/components/common/data-table";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { EstadoVehiculo, Vehiculo } from "../flota.types";

/**
 * Mapeo de estados reales del backend (active | maintenance | out_of_service, en inglés)
 * a las etiquetas y colores pedidos en ST-22.2: Verde=Disponible, Naranja=Mantenimiento.
 * "out_of_service" no está en el ticket original; se muestra en rojo por ser el más crítico.
 */
const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "Disponible", className: "bg-success/10 text-success" },
  maintenance: { label: "Mantenimiento", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  out_of_service: { label: "Fuera de servicio", className: "bg-destructive/10 text-destructive" },
};

function EstadoBadge({ estado }: { estado: EstadoVehiculo }) {
  const config = ESTADO_BADGE[estado.name] ?? { label: estado.name, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export function VehiculosTable({
  data,
  loading,
  onEdit,
  searchActive = false,
}: {
  data: Vehiculo[];
  loading?: boolean;
  onEdit: (vehiculo: Vehiculo) => void;
  searchActive?: boolean;
}) {
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
      ),
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
          emptyMessage={
            searchActive
              ? "No encontramos vehículos con ese criterio."
              : "Registra el primer vehículo para comenzar a gestionar la flota."
          }
        />
      </div>

      <div className="space-y-3 md:hidden">
        {loading && Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}

        {!loading && data.length === 0 && (
          <EmptyState
            title="Sin resultados"
            description={
              searchActive
                ? "No encontramos vehículos con ese criterio."
                : "Registra el primer vehículo para comenzar a gestionar la flota."
            }
          />
        )}

        {!loading && data.map((vehiculo) => (
          <article key={vehiculo.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-sm font-semibold tracking-tight">{vehiculo.plate}</p>
                <h3 className="truncate font-medium">{vehiculo.type} · {vehiculo.model}</h3>
              </div>
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
        ))}
      </div>
    </>
  );
}

export function VehiculosSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative w-full md:max-w-sm">
      <label htmlFor="vehiculos-search" className="sr-only">Buscar vehículos</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        id="vehiculos-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Placa, modelo o tipo"
        className="h-10 pl-10"
        aria-label="Buscar por placa, modelo o tipo"
      />
    </div>
  );
}
