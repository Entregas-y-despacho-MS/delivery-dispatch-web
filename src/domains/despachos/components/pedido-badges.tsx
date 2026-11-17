import { Lock, MapPinOff, Minus, Sparkles, UserCheck, Zap } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import type { PedidoPendiente, PrioridadPedido } from "../types/despachos.types";

/**
 * Prioridad del pedido (ST-58.1): rojo «Urgente», gris «Normal».
 * Recibe solo la prioridad para poder reutilizarse en la bandeja y en el tablero Kanban.
 */
export function PrioridadBadge({ priority }: { priority: PrioridadPedido }) {
  if (priority === "urgent") {
    return (
      <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">
        <Zap aria-hidden /> Urgente
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
      <Minus aria-hidden /> Normal
    </Badge>
  );
}

/**
 * Situación en la bandeja según el campo `inbox` de ST-48.2:
 * reservado por otro (ámbar, bloquea la fila), reservado por mí y propuesto por el generador (azul).
 */
export function SituacionBadge({ pedido }: { pedido: Pick<PedidoPendiente, "inbox" | "reservation"> }) {
  if (pedido.inbox === "reserved" && pedido.reservation) {
    if (pedido.reservation.reservedByMe) {
      return (
        <Badge variant="outline" className="border-info/20 bg-info/10 text-info">
          <UserCheck aria-hidden /> En tu planificación
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="h-auto whitespace-normal border-warning/20 bg-warning/10 text-left text-warning">
        <Lock aria-hidden /> En planificación por {pedido.reservation.reservedByName}
      </Badge>
    );
  }

  if (pedido.inbox === "proposed") {
    return (
      <Badge variant="outline" className="border-info/20 bg-info/10 text-info">
        <Sparkles aria-hidden /> Propuesto
      </Badge>
    );
  }

  return null;
}

/** Dirección pendiente de validar (estado `address_review`). */
export function DireccionRevisionBadge({ status }: Pick<PedidoPendiente, "status">) {
  if (status !== "address_review") return null;
  return (
    <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning">
      <MapPinOff aria-hidden /> Dirección en revisión
    </Badge>
  );
}

/** Todos los badges que aplican a un pedido, en orden de importancia. */
export function PedidoBadges({ pedido }: { pedido: PedidoPendiente }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SituacionBadge pedido={pedido} />
      <DireccionRevisionBadge status={pedido.status} />
    </div>
  );
}
