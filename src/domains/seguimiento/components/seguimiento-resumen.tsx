import { CalendarDays, Clock, PackageCheck } from "lucide-react";

import { etiquetaEstado, etiquetaRespuesta, formatearFechaEntrega, formatearFranjaEntrega, formatearFechaHora } from "../seguimiento.format";
import type { SeguimientoPublico } from "../seguimiento.types";

/**
 * Estado, fecha y franja del pedido (escenario 1). Solo lo mínimo: sin dirección,
 * teléfono, OTP ni fotos de entrega, que el back tampoco envía.
 */
export function SeguimientoResumen({ pedido }: { pedido: SeguimientoPublico }) {
  const { selfService: autoservicio } = pedido;
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm" aria-label="Estado de tu pedido">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado de tu pedido</p>
          <h1 className="text-xl font-semibold">{etiquetaEstado(pedido.status)}</h1>
        </div>
        {pedido.trackingCode && (
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs" title="Código de seguimiento">
            {pedido.trackingCode}
          </span>
        )}
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">Fecha de entrega</dt>
            <dd className="font-medium first-letter:uppercase">{formatearFechaEntrega(pedido.deliveryDate)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">Horario</dt>
            <dd className="font-medium">{formatearFranjaEntrega(pedido.windowStart, pedido.windowEnd)}</dd>
          </div>
        </div>
      </dl>

      <p className="flex items-center gap-2 text-sm">
        <PackageCheck className="size-4 text-muted-foreground" aria-hidden />
        {etiquetaRespuesta(pedido.customerConfirmation)}
        {autoservicio.open && autoservicio.windowClosesAt && (
          <span className="text-muted-foreground">{` · puedes responder hasta el ${formatearFechaHora(autoservicio.windowClosesAt)}`}</span>
        )}
      </p>
    </section>
  );
}
