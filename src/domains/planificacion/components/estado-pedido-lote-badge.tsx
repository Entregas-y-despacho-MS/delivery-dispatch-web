import { Lock, Sparkles, UserCheck } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";

interface EstadoPedidoLoteBadgeProps {
  /**
   * Coordinador que tiene el pedido reservado en su planificación.
   * Sin reserva, el pedido es solo una propuesta del generador.
   */
  reservadoPor?: { nombre: string; esMio: boolean } | null;
}

/**
 * Distinción que pide ST-215.1 en el detalle del lote:
 * «Propuesto» (lo armó el generador) frente a «En planificación por [Nombre]» (otro coordinador lo tomó).
 */
export function EstadoPedidoLoteBadge({ reservadoPor }: EstadoPedidoLoteBadgeProps) {
  if (reservadoPor?.esMio) {
    return (
      <Badge variant="outline" className="border-info/20 bg-info/10 text-info">
        <UserCheck aria-hidden /> En tu planificación
      </Badge>
    );
  }
  if (reservadoPor) {
    return (
      <Badge variant="outline" className="h-auto whitespace-normal border-warning/20 bg-warning/10 text-left text-warning">
        <Lock aria-hidden /> En planificación por {reservadoPor.nombre}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-info/20 bg-info/10 text-info">
      <Sparkles aria-hidden /> Propuesto
    </Badge>
  );
}
