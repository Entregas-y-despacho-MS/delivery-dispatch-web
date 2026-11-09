import { MapPin, Radio, RadioTower, Truck } from "lucide-react";

import type { FiltroEstadoFlota, PosicionFlotaEnVivo } from "../flota-posiciones.types";
import { esUbicacionSinSenal, filtrarPosicionesFlota } from "../flota-posiciones.types";

export function PanelVehiculosFlota({
  posiciones,
  umbralMinutos,
  ahora,
  zonaId,
  estado,
  rutaSeleccionada,
  onZonaChange,
  onEstadoChange,
  onSeleccionar,
}: {
  posiciones: PosicionFlotaEnVivo[];
  umbralMinutos: number;
  ahora: number;
  zonaId: string;
  estado: FiltroEstadoFlota;
  rutaSeleccionada: number | null;
  onZonaChange: (value: string) => void;
  onEstadoChange: (value: FiltroEstadoFlota) => void;
  onSeleccionar: (routeBatchId: number) => void;
}) {
  const zonas = [...new Map(posiciones.filter((p) => p.deliveryZone).map((p) => [p.deliveryZone!.id, p.deliveryZone!])).values()]
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const filtradas = filtrarPosicionesFlota(posiciones, zonaId, estado, umbralMinutos, ahora);

  return (
    <aside className="space-y-4 rounded-xl border bg-card p-4 shadow-sm" aria-label="Vehículos en ruta">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Vehículos en ruta</h2>
        <span className="text-xs text-muted-foreground" aria-live="polite">{filtradas.length} de {posiciones.length}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="grid gap-1 text-sm">
          <span>Zona</span>
          <select value={zonaId} onChange={(evento) => onZonaChange(evento.target.value)} className="h-10 rounded-md border bg-background px-3" aria-label="Filtrar por zona">
            <option value="todas">Todas las zonas</option>
            {zonas.map((zona) => <option key={zona.id} value={String(zona.id)}>{zona.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Estado</span>
          <select value={estado} onChange={(evento) => onEstadoChange(evento.target.value as FiltroEstadoFlota)} className="h-10 rounded-md border bg-background px-3" aria-label="Filtrar por estado">
            <option value="todos">Todos los estados</option>
            <option value="en_movimiento">En movimiento</option>
            <option value="sin_senal">Sin señal</option>
          </select>
        </label>
      </div>

      {filtradas.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No hay vehículos que coincidan con estos filtros.</p>
      ) : (
        <ul className="max-h-[min(50vh,520px)] space-y-2 overflow-y-auto" aria-label="Lista de vehículos">
          {filtradas.map((posicion) => {
            const sinSenal = esUbicacionSinSenal(posicion, umbralMinutos, ahora);
            const sinCoordenadas = posicion.lastLatitude === null || posicion.lastLongitude === null;
            const enMovimiento = posicion.currentStop?.status === "in_transit";
            const estadoVisible = sinCoordenadas ? "Sin ubicación GPS" : sinSenal ? "Sin señal" : enMovimiento ? "En movimiento" : "En ruta";
            return (
              <li key={posicion.routeBatchId}>
                <button
                  type="button"
                  onClick={() => onSeleccionar(posicion.routeBatchId)}
                  aria-pressed={rutaSeleccionada === posicion.routeBatchId}
                  aria-label={sinCoordenadas
                    ? `${posicion.vehiclePlate}, sin ubicación GPS; no se puede centrar`
                    : `Centrar mapa en ${posicion.vehiclePlate}, ${estadoVisible}`}
                  disabled={sinCoordenadas}
                  className={`w-full rounded-lg border p-3 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent ${rutaSeleccionada === posicion.routeBatchId ? "border-primary bg-accent" : ""}`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${sinSenal ? "bg-zinc-500/15 text-zinc-500" : "bg-primary/10 text-primary"}`}>
                      <Truck className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{posicion.vehiclePlate}</span>
                        <span className={`inline-flex shrink-0 items-center gap-1 text-xs ${sinSenal || sinCoordenadas ? "text-zinc-500" : "text-emerald-700 dark:text-emerald-400"}`}>
                          {sinSenal || sinCoordenadas ? <Radio className="size-3.5" aria-hidden /> : <RadioTower className="size-3.5" aria-hidden />}
                          {estadoVisible}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{posicion.driverFullName}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden />
                        {posicion.deliveryZone?.name ?? "Zona sin asignar"}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">Parada: {posicion.currentStop?.trackingCode ?? "Sin parada abierta"}</span>
                      {sinCoordenadas && <span className="mt-1 block text-xs text-zinc-500">No hay coordenadas GPS para centrar el mapa.</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
