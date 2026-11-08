import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ESTADOS_MANTENIMIENTO, ETIQUETA_ESTADO_MANTENIMIENTO, type FiltrosMantenimiento } from "../flota.mantenimiento";
import type { EstadoMantenimiento } from "../flota.types";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export interface VehiculoOpcion {
  id: number;
  plate: string;
  model: string;
}

interface MantenimientosFiltrosProps {
  filtros: FiltrosMantenimiento;
  vehiculos: VehiculoOpcion[];
  rangoInvertido: boolean;
  onVehiculoChange: (vehiculoId: number | null) => void;
  onEstadoChange: (estado: EstadoMantenimiento | null) => void;
  onDesdeChange: (desde: string) => void;
  onHastaChange: (hasta: string) => void;
  onLimpiar: () => void;
}

/** Filtros del historial de mantenimientos (ST-64.2): vehículo, estado y rango de fechas de registro. */
export function MantenimientosFiltros({
  filtros,
  vehiculos,
  rangoInvertido,
  onVehiculoChange,
  onEstadoChange,
  onDesdeChange,
  onHastaChange,
  onLimpiar,
}: MantenimientosFiltrosProps) {
  // Un vehículo dado de baja ya no sale en la lista, pero su historial sí: se muestra igual en el filtro.
  const faltaElegido = filtros.vehiculoId !== null && !vehiculos.some((v) => v.id === filtros.vehiculoId);
  const hayFiltros = filtros.vehiculoId !== null || filtros.estado !== null || !!filtros.desde || !!filtros.hasta;
  const describirRango = rangoInvertido ? "mantenimientos-rango-error" : undefined;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="mantenimientos-vehiculo" className="text-xs font-medium text-muted-foreground">Vehículo</label>
          <select
            id="mantenimientos-vehiculo"
            className={CLASE_SELECT}
            value={filtros.vehiculoId ?? ""}
            onChange={(e) => onVehiculoChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Toda la flota</option>
            {faltaElegido && <option value={filtros.vehiculoId!}>Vehículo #{filtros.vehiculoId}</option>}
            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="mantenimientos-estado" className="text-xs font-medium text-muted-foreground">Estado</label>
          <select
            id="mantenimientos-estado"
            className={CLASE_SELECT}
            value={filtros.estado ?? ""}
            onChange={(e) => onEstadoChange((e.target.value || null) as EstadoMantenimiento | null)}
          >
            <option value="">Todos</option>
            {ESTADOS_MANTENIMIENTO.map((estado) => (
              <option key={estado} value={estado}>{ETIQUETA_ESTADO_MANTENIMIENTO[estado]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="mantenimientos-desde" className="text-xs font-medium text-muted-foreground">Registrado desde</label>
          <Input id="mantenimientos-desde" type="date" value={filtros.desde} max={filtros.hasta || undefined}
            onChange={(e) => onDesdeChange(e.target.value)}
            aria-invalid={rangoInvertido || undefined} aria-describedby={describirRango} />
        </div>
        <div className="space-y-1">
          <label htmlFor="mantenimientos-hasta" className="text-xs font-medium text-muted-foreground">Registrado hasta</label>
          <Input id="mantenimientos-hasta" type="date" value={filtros.hasta} min={filtros.desde || undefined}
            onChange={(e) => onHastaChange(e.target.value)}
            aria-invalid={rangoInvertido || undefined} aria-describedby={describirRango} />
        </div>
      </div>
      {rangoInvertido && (
        <p id="mantenimientos-rango-error" role="alert" className="text-sm text-destructive">
          La fecha «Registrado desde» no puede ser posterior a «Registrado hasta».
        </p>
      )}
      {hayFiltros && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onLimpiar}>Quitar filtros</Button>
        </div>
      )}
    </div>
  );
}
