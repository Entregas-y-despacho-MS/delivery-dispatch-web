import { useMemo } from "react";
import { MapPin, Truck } from "lucide-react";

import type { PosicionFlotaEnVivo } from "../flota-posiciones.types";

export function PanelVehiculosFlota({
  posiciones,
  zonaId,
  onZonaChange,
  rutaSeleccionada,
  onSeleccionar,
}: {
  posiciones: PosicionFlotaEnVivo[];
  zonaId: string;
  onZonaChange: (value: string) => void;
  rutaSeleccionada: number | null;
  onSeleccionar: (routeBatchId: number) => void;
}) {
  const zonas = useMemo(() => [...new Map(posiciones.filter((p) => p.deliveryZone).map((p) => [p.deliveryZone!.id, p.deliveryZone!])).values()]
    .sort((a, b) => a.name.localeCompare(b.name, "es")), [posiciones]);
  const filtradas = posiciones.filter((posicion) => zonaId === "todas" || String(posicion.deliveryZone?.id ?? "") === zonaId);

  return (
    <aside className="space-y-4 rounded-xl border bg-card p-4 shadow-sm" aria-label="Vehículos en ruta">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Vehículos en ruta</h2>
        <span className="text-xs text-muted-foreground" aria-live="polite">{filtradas.length} de {posiciones.length}</span>
      </div>
      <label className="grid gap-1 text-sm">
        <span>Zona</span>
        <select value={zonaId} onChange={(evento) => onZonaChange(evento.target.value)} className="h-10 rounded-md border bg-background px-3" aria-label="Filtrar por zona">
          <option value="todas">Todas las zonas</option>
          {zonas.map((zona) => <option key={zona.id} value={String(zona.id)}>{zona.name}</option>)}
        </select>
      </label>
      <ul className="max-h-[min(50vh,520px)] space-y-2 overflow-y-auto" aria-label="Lista de vehículos">
        {filtradas.map((posicion) => (
          <li key={posicion.routeBatchId}>
            <button
              type="button"
              onClick={() => onSeleccionar(posicion.routeBatchId)}
              aria-pressed={rutaSeleccionada === posicion.routeBatchId}
              className={`w-full rounded-lg border p-3 text-left hover:bg-accent ${rutaSeleccionada === posicion.routeBatchId ? "border-primary bg-accent" : ""}`}
            >
              <span className="flex items-start gap-3">
                <Truck className="mt-0.5 size-4 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{posicion.vehiclePlate}</span>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">{posicion.driverFullName}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden />{posicion.deliveryZone?.name ?? "Zona sin asignar"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">Parada: {posicion.currentStop?.trackingCode ?? "Sin parada abierta"}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
