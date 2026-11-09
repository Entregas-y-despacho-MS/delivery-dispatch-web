import { MapPin, Truck } from "lucide-react";

import type { PosicionFlotaEnVivo } from "../flota-posiciones.types";

export function PanelVehiculosFlota({
  posiciones,
  rutaSeleccionada,
  onSeleccionar,
}: {
  posiciones: PosicionFlotaEnVivo[];
  rutaSeleccionada: number | null;
  onSeleccionar: (routeBatchId: number) => void;
}) {
  return (
    <aside className="space-y-4 rounded-xl border bg-card p-4 shadow-sm" aria-label="Vehículos en ruta">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Vehículos en ruta</h2>
        <span className="text-xs text-muted-foreground" aria-live="polite">{posiciones.length}</span>
      </div>
      <ul className="max-h-[min(50vh,520px)] space-y-2 overflow-y-auto" aria-label="Lista de vehículos">
        {posiciones.map((posicion) => (
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
