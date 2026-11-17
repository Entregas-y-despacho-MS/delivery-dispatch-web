import { AlertTriangle, CalendarClock } from "lucide-react";

import { formatearFechaHoraExacta, formatearVentanaConDia } from "../despacho-detalle.format";
import type { IncidenciaDetalle, ReprogramacionDetalle } from "../types/despacho-detalle.types";

const QUIEN: Record<ReprogramacionDetalle["rescheduledByType"], string> = {
  customer: "El cliente",
  coordinator: "Coordinación",
  system: "El sistema",
};

/** Pestaña Incidencias: lo que reportó el repartidor y las reprogramaciones, de la más antigua a la más reciente. */
export function FichaIncidencias({ incidencias, reprogramaciones }: { incidencias: IncidenciaDetalle[]; reprogramaciones: ReprogramacionDetalle[] }) {
  return (
    <div className="space-y-6">
      <section className="space-y-2" aria-label="Incidencias">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4" aria-hidden />{`Incidencias (${incidencias.length})`}</h3>
        {incidencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">El repartidor no reportó incidencias.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {incidencias.map((incidencia) => (
              <li key={incidencia.id} className="space-y-0.5 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{incidencia.reasonName}</span>
                  <time className="text-xs text-muted-foreground" dateTime={incidencia.occurredAt}>{formatearFechaHoraExacta(incidencia.occurredAt)}</time>
                </div>
                <p className="text-muted-foreground">{incidencia.description ?? "Sin nota del repartidor."}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2" aria-label="Reprogramaciones">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="size-4" aria-hidden />{`Reprogramaciones (${reprogramaciones.length})`}</h3>
        {reprogramaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">El pedido no se reprogramó.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {reprogramaciones.map((cambio) => (
              <li key={cambio.id} className="space-y-0.5 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{cambio.reasonName}</span>
                  <time className="text-xs text-muted-foreground" dateTime={cambio.createdAt}>{formatearFechaHoraExacta(cambio.createdAt)}</time>
                </div>
                <p className="text-muted-foreground">
                  {`${cambio.rescheduledBy?.fullName ?? QUIEN[cambio.rescheduledByType]}: ${formatearVentanaConDia(cambio.previousWindowStart, cambio.previousWindowEnd)} → ${formatearVentanaConDia(cambio.newWindowStart, cambio.newWindowEnd)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
