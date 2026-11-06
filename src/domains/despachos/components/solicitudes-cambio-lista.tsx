import { AlertTriangle, CalendarClock, Link2, MailX } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { RequireRole } from "@/shared/guards/require-role";
import { ROLES } from "@/config/roles";
import { formatearFechaHoraExacta, formatearFechaTurnoDetalle, formatearVentana } from "../despacho-detalle.format";
import type { SolicitudCambio } from "../solicitudes-cambio.types";

export interface SolicitudesCambioListaProps {
  data: SolicitudCambio[];
  /** Solo el coordinador reprograma (POST /dispatches/:id/reschedule es CoordinatorOnly). */
  puedeResolver: boolean;
  onResolver: (solicitud: SolicitudCambio) => void;
  onMostrarEnlace: (solicitud: SolicitudCambio) => void;
  /** Despacho cuyo enlace se está pidiendo. */
  pidiendoEnlaceId?: number;
  hrefFicha: (id: number) => string;
}

/** Una tarjeta por solicitud, de la más antigua a la más nueva (orden del back). */
export function SolicitudesCambioLista({ data, puedeResolver, onResolver, onMostrarEnlace, pidiendoEnlaceId, hrefFicha }: SolicitudesCambioListaProps) {
  return (
    <ul className="space-y-3" aria-label="Solicitudes de cambio pendientes">
      {data.map((s) => (
        <li key={s.dispatchId} aria-label={`Solicitud de ${s.trackingCode}`} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={hrefFicha(s.dispatchId)} className="font-semibold text-primary underline-offset-4 hover:underline" aria-label={`Ver ficha de ${s.trackingCode}`}>
                  {s.trackingCode}
                </Link>
                {!s.hasContactEmail && (
                  <Badge variant="outline"><MailX className="size-3" aria-hidden /> Sin correo</Badge>
                )}
              </div>
              <p className="text-sm">{s.contactName ?? "Cliente sin nombre"}</p>
              <p className="text-xs text-muted-foreground">
                {s.zoneName ?? "Sin zona"} · {s.deliveryDate ? formatearFechaTurnoDetalle(s.deliveryDate) : "Sin fecha"} · {formatearVentana(s.windowStart, s.windowEnd)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {s.canRevealTrackingLink && (
                <Button type="button" variant="outline" size="sm" onClick={() => onMostrarEnlace(s)} disabled={pidiendoEnlaceId === s.dispatchId}>
                  <Link2 aria-hidden /> {pidiendoEnlaceId === s.dispatchId ? "Copiando…" : "Mostrar enlace"}
                </Button>
              )}
              {puedeResolver && (
                <RequireRole roles={[ROLES.COORDINADOR]}>
                  <Button type="button" size="sm" onClick={() => onResolver(s)}>
                    <CalendarClock aria-hidden /> Reprogramar
                  </Button>
                </RequireRole>
              )}
            </div>
          </div>

          <figure className="rounded-lg bg-muted/50 p-3 text-sm">
            <blockquote className={s.request.detail ? "" : "italic text-muted-foreground"}>
              {s.request.detail ?? "El cliente no dejó un comentario."}
            </blockquote>
            <figcaption className="mt-1 text-xs text-muted-foreground">
              Pedido el {formatearFechaHoraExacta(s.request.requestedAt)}
              {s.request.responseWindowWasOpen ? " · con su ventana de respuesta abierta" : " · con la ventana de respuesta ya cerrada"}
            </figcaption>
          </figure>

          {!s.promiseIsFirm && (
            <p role="note" className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              La promesa no está en firme: no saldrá la orden de preparación hasta que resuelvas esta solicitud.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
