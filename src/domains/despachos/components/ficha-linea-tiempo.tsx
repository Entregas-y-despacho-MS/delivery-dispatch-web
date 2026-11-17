import { MapPin, UserRound } from "lucide-react";

import {
  enlaceMapa,
  etiquetaEstadoDespacho,
  etiquetaEvento,
  formatearCoordenadas,
  formatearFechaHoraExacta,
  quienOrigino,
} from "../despacho-detalle.format";
import type { EvidenciaDetalle, EventoDetalle } from "../types/despacho-detalle.types";

interface FichaLineaTiempoProps {
  eventos: EventoDetalle[];
  receptor: EvidenciaDetalle | null;
}

/**
 * Línea de tiempo vertical (escenario 1 de ES-56): hora exacta, estado, coordenadas GPS y operador de cada
 * evento, del más antiguo al más reciente, y al final quién recibió el pedido.
 */
export function FichaLineaTiempo({ eventos, receptor }: FichaLineaTiempoProps) {
  if (eventos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">El despacho todavía no tiene eventos registrados.</p>;
  }

  return (
    <div className="space-y-4">
      <ol className="relative space-y-4 border-l pl-6" aria-label="Línea de tiempo">
        {eventos.map((evento) => {
          const coordenadas = formatearCoordenadas(evento.latitude, evento.longitude);
          return (
            <li key={evento.id} className="relative">
              <span className="absolute -left-[1.85rem] top-1.5 size-3 rounded-full border-2 border-background bg-primary" aria-hidden />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-medium">
                  {etiquetaEvento(evento.eventType)}
                  {evento.status && <span className="text-muted-foreground">{` → ${etiquetaEstadoDespacho(evento.status)}`}</span>}
                </p>
                <time className="text-xs tabular-nums text-muted-foreground" dateTime={evento.occurredAt}>
                  {formatearFechaHoraExacta(evento.occurredAt)}
                </time>
              </div>
              {(evento.detail || evento.reason) && (
                <p className="text-sm text-muted-foreground">{[evento.reason, evento.detail].filter(Boolean).join(" · ")}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><UserRound className="size-3.5" aria-hidden />{quienOrigino(evento)}</span>
                {coordenadas && evento.latitude !== null && evento.longitude !== null ? (
                  <a className="flex items-center gap-1 underline underline-offset-4" href={enlaceMapa(evento.latitude, evento.longitude)} target="_blank" rel="noreferrer">
                    <MapPin className="size-3.5" aria-hidden />{coordenadas}
                  </a>
                ) : (
                  <span className="flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />Sin GPS</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="rounded-md border bg-muted/40 p-3 text-sm" aria-label="Receptor">
        {receptor?.receiverName
          ? `Recibió: ${receptor.receiverName}${receptor.receiverDocument ? ` (${receptor.receiverDocument})` : ""} · ${formatearFechaHoraExacta(receptor.capturedAt)}`
          : "Todavía no hay receptor: nadie firmó la entrega."}
      </p>
    </div>
  );
}
