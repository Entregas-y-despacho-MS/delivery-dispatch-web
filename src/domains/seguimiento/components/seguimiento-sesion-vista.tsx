import { CalendarDays, Clock, LogOut, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { mensajeErrorAcceso } from "../seguimiento.acceso";
import { etiquetaEstado, formatearFechaEntrega, formatearFranjaEntrega, formatearHora } from "../seguimiento.format";
import type { SeguimientoPorSesion } from "../types/seguimiento.types";
import { EnCaminoCard } from "./en-camino-card";

interface SeguimientoSesionVistaProps {
  pedido: SeguimientoPorSesion | undefined;
  cargando: boolean;
  error: unknown;
  recargando: boolean;
  expiraEn: string | null;
  onReintentar: () => void;
  onSalir: () => void;
}

/**
 * Lo que se ve tras verificar el código (ST-309.2): estado, fecha, franja y, en camino, la tarjeta en vivo.
 * Solo consulta: confirmar, reprogramar, pedir un cambio o calificar siguen siendo del enlace del correo.
 */
export function SeguimientoSesionVista({ pedido, cargando, error, recargando, expiraEn, onReintentar, onSalir }: SeguimientoSesionVistaProps) {
  if (cargando) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  if (!pedido) {
    return (
      <section role="alert" className="flex flex-col items-center gap-3 rounded-xl border bg-card px-5 py-10 text-center shadow-sm">
        <TriangleAlert className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">No pudimos cargar tu pedido</h1>
        <p className="max-w-md text-sm text-muted-foreground">{error ? mensajeErrorAcceso(parseApiError(error)) : "Intenta de nuevo."}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onReintentar} disabled={recargando}>
            <RefreshCw className={recargando ? "animate-spin" : undefined} aria-hidden /> Reintentar
          </Button>
          <Button type="button" variant="ghost" onClick={onSalir}>Salir</Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
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
        {error ? <p role="alert" className="text-sm text-destructive">{mensajeErrorAcceso(parseApiError(error))}</p> : null}
      </section>

      <EnCaminoCard pedido={pedido} />

      <section className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Solo consulta. Para confirmar o cambiar tu entrega usa el enlace que te enviamos por correo.
          {expiraEn && ` Tu acceso vence a las ${formatearHora(expiraEn)}.`}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onSalir}>
          <LogOut aria-hidden /> Salir
        </Button>
      </section>
    </div>
  );
}
