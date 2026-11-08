import { lazy, Suspense } from "react";
import { Bike, Clock3, MapPin, UserRound } from "lucide-react";

import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatearHora } from "../seguimiento.format";
import { descripcionVehiculo, detalleEta, estaEnCamino, textoEta } from "../seguimiento.en-vivo";
import type { SeguimientoPublico } from "../seguimiento.types";

// Leaflet pesa: solo se descarga cuando hay una posición que mostrar.
const MiniMapa = lazy(() => import("./mini-mapa"));

/**
 * «Tu pedido está en camino» (ST-40.2, RF-U15, RF-U17 y RF-U18): llegada estimada, quién entrega y, cuando
 * ya es su turno (in_transit), dónde está el repartidor. Fuera de esos estados no ocupa lugar.
 */
export function EnCaminoCard({ pedido }: { pedido: SeguimientoPublico }) {
  const { eta, driver, location } = pedido;
  if (!estaEnCamino(pedido.status) || (!eta && !driver)) return null;
  const vehiculo = driver ? descripcionVehiculo(driver) : null;
  const esSuTurno = pedido.status === "in_transit";

  return (
    <section className="space-y-4 rounded-xl border border-brand-turquoise/40 bg-card p-5 shadow-sm" aria-label="Tu pedido está en camino">
      <div>
        <h2 className="text-lg font-semibold">Tu pedido está en camino</h2>
        <p className="text-sm text-muted-foreground">
          {esSuTurno ? "El repartidor va hacia tu dirección." : "El repartidor salió con tu pedido y otras entregas."}
        </p>
      </div>

      {eta && (
        <div className="flex items-start gap-3 rounded-lg bg-brand-soft/60 p-3">
          <Clock3 className="mt-0.5 size-5 text-brand-blue" aria-hidden />
          <div>
            <p className="font-semibold" aria-live="polite">{textoEta(eta, pedido.windowEnd)}</p>
            <p className="text-xs text-muted-foreground">{detalleEta(eta)}</p>
          </div>
        </div>
      )}

      {driver && (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Te entrega</dt>
              <dd className="font-medium">{driver.name}</dd>
            </div>
          </div>
          {vehiculo && (
            <div className="flex items-start gap-2">
              <Bike className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Vehículo</dt>
                <dd className="font-medium">{vehiculo}</dd>
              </div>
            </div>
          )}
        </dl>
      )}

      {esSuTurno && location && (
        <figure className="space-y-2">
          <Suspense fallback={<Skeleton className="h-56 w-full rounded-lg" />}>
            <MiniMapa ubicacion={location} />
          </Suspense>
          <figcaption className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden />
            {`Ubicación del repartidor a las ${formatearHora(location.recordedAt)}`}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
