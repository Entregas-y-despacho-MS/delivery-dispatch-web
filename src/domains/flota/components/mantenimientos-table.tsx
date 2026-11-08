import { CheckCircle2, Play } from "lucide-react";

import type { Column } from "@/shared/components/common/data-table";
import { ResponsiveList } from "@/shared/components/common/responsive-list";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  ETIQUETA_ESTADO_MANTENIMIENTO,
  ETIQUETA_TIPO_MANTENIMIENTO,
  formatearFechaHora,
  siguienteEstado,
} from "../flota.mantenimiento";
import type { EstadoMantenimiento, Mantenimiento } from "../flota.types";

const CLASE_ESTADO: Record<EstadoMantenimiento, string> = {
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-brand-blue/10 text-brand-blue dark:text-brand-turquoise",
  completed: "bg-success/10 text-success",
};

function EstadoMantenimientoBadge({ estado }: { estado: EstadoMantenimiento }) {
  return (
    <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium", CLASE_ESTADO[estado])}>
      {ETIQUETA_ESTADO_MANTENIMIENTO[estado]}
    </span>
  );
}

function TipoCelda({ mantenimiento }: { mantenimiento: Mantenimiento }) {
  return (
    <div className="space-y-0.5">
      <p className="font-medium">{ETIQUETA_TIPO_MANTENIMIENTO[mantenimiento.maintenanceType]}</p>
      {mantenimiento.vehicleIncidentType && (
        <p className="text-xs text-muted-foreground">{mantenimiento.vehicleIncidentType.name}</p>
      )}
    </div>
  );
}

function FechasCelda({ mantenimiento }: { mantenimiento: Mantenimiento }) {
  return (
    <div className="space-y-0.5 text-xs tabular-nums">
      {mantenimiento.scheduledAt && <p>Programado: {formatearFechaHora(mantenimiento.scheduledAt)}</p>}
      <p className={mantenimiento.completedAt ? undefined : "text-muted-foreground"}>
        Cierre: {formatearFechaHora(mantenimiento.completedAt)}
      </p>
    </div>
  );
}

function AccionMantenimiento({
  mantenimiento,
  onAvanzar,
  deshabilitado,
}: {
  mantenimiento: Mantenimiento;
  onAvanzar: (mantenimiento: Mantenimiento) => void;
  deshabilitado?: boolean;
}) {
  const siguiente = siguienteEstado(mantenimiento.status);
  if (!siguiente) return null;
  const iniciar = siguiente === "in_progress";
  return (
    <Button
      type="button"
      size="sm"
      variant={iniciar ? "outline" : "default"}
      disabled={deshabilitado}
      onClick={() => onAvanzar(mantenimiento)}
      aria-label={`${iniciar ? "Iniciar" : "Completar"} mantenimiento de ${mantenimiento.vehicle.plate}`}
    >
      {iniciar ? <Play aria-hidden /> : <CheckCircle2 aria-hidden />}
      {iniciar ? "Iniciar" : "Completar"}
    </Button>
  );
}

interface MantenimientosTableProps {
  data: Mantenimiento[];
  loading?: boolean;
  filtrado?: boolean;
  onLimpiarFiltros?: () => void;
  onAvanzar: (mantenimiento: Mantenimiento) => void;
  avanzando?: boolean;
}

/** Historial de mantenimientos (ST-64.2): lo más reciente primero, con la acción del siguiente paso. */
export function MantenimientosTable({
  data,
  loading,
  filtrado = false,
  onLimpiarFiltros,
  onAvanzar,
  avanzando,
}: MantenimientosTableProps) {
  const columns: Column<Mantenimiento>[] = [
    {
      header: "Registrado",
      cell: (m) => <span className="text-sm tabular-nums">{formatearFechaHora(m.createdAt)}</span>,
      className: "w-[13%]",
    },
    {
      header: "Vehículo",
      cell: (m) => (
        <div className="space-y-0.5">
          <p className="font-mono font-medium tracking-tight">{m.vehicle.plate}</p>
          <p className="text-xs text-muted-foreground">{m.vehicle.model}</p>
        </div>
      ),
      className: "w-[14%]",
    },
    { header: "Tipo", cell: (m) => <TipoCelda mantenimiento={m} />, className: "w-[17%]" },
    {
      header: "Descripción",
      cell: (m) => <p className="line-clamp-2 text-sm" title={m.description}>{m.description}</p>,
      className: "w-[24%]",
    },
    { header: "Estado", cell: (m) => <EstadoMantenimientoBadge estado={m.status} />, className: "w-[10%]" },
    { header: "Fechas", cell: (m) => <FechasCelda mantenimiento={m} />, className: "w-[12%]" },
    {
      header: "",
      cell: (m) => (
        <div className="flex justify-end">
          <AccionMantenimiento mantenimiento={m} onAvanzar={onAvanzar} deshabilitado={avanzando} />
        </div>
      ),
      className: "w-[10%] text-right",
    },
  ];

  return (
    <ResponsiveList
      columns={columns}
      data={data}
      loading={loading}
      isFiltered={filtrado}
      onClearFilters={onLimpiarFiltros}
      emptyMessage={filtrado
        ? "No hay mantenimientos con esos filtros."
        : "Todavía no se registraron mantenimientos en la flota."}
      mobileSkeletonCount={4}
      renderCard={(m) => (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-sm font-semibold tracking-tight">{m.vehicle.plate} · {m.vehicle.model}</p>
              <TipoCelda mantenimiento={m} />
            </div>
            <EstadoMantenimientoBadge estado={m.status} />
          </div>
          <p className="mt-3 text-sm">{m.description}</p>
          <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3">
            <div className="space-y-0.5 text-xs tabular-nums">
              <p>Registrado: {formatearFechaHora(m.createdAt)}</p>
              <FechasCelda mantenimiento={m} />
            </div>
            <AccionMantenimiento mantenimiento={m} onAvanzar={onAvanzar} deshabilitado={avanzando} />
          </div>
        </article>
      )}
    />
  );
}
