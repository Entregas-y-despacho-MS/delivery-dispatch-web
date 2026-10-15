import { Check, Loader2, Minus, Zap } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { nombrePrioridad, puedeCambiarPrioridad } from "../despachos.prioridad";
import type { PedidoPendiente, PrioridadPedido } from "../despachos.types";
import { PrioridadBadge } from "./pedido-badges";

const OPCIONES: { valor: PrioridadPedido; etiqueta: string; icono: typeof Zap }[] = [
  { valor: "urgent", etiqueta: "Marcar como urgente", icono: Zap },
  { valor: "normal", etiqueta: "Marcar como normal", icono: Minus },
];

export type PedidoConPrioridad = Pick<PedidoPendiente, "id" | "orderNumber" | "priority" | "status">;

interface PrioridadSelectorProps {
  pedido: PedidoConPrioridad;
  /** Sin esta función el badge es de solo lectura (p. ej. en vistas sin permiso para cambiarla). */
  onCambiar?: (pedido: PedidoConPrioridad, prioridad: PrioridadPedido) => void;
  /** El cambio de este pedido se está guardando. */
  guardando?: boolean;
}

/**
 * Cambio rápido de prioridad (ST-58.1): al hacer clic en el badge se abre un menú con
 * «Marcar como urgente / normal». Solo se ofrece en los estados que el back acepta (ST-58.2);
 * en los demás el badge queda fijo y explica por qué al pasar el mouse.
 */
export function PrioridadSelector({ pedido, onCambiar, guardando = false }: PrioridadSelectorProps) {
  if (!onCambiar) return <PrioridadBadge priority={pedido.priority} />;

  if (!puedeCambiarPrioridad(pedido.status)) {
    return (
      <span title="La prioridad solo se cambia en pedidos pendientes, en planificación o programados.">
        <PrioridadBadge priority={pedido.priority} />
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={guardando}
        aria-label={`Cambiar la prioridad de ${pedido.orderNumber}, ahora ${nombrePrioridad(pedido.priority)}`}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
      >
        <PrioridadBadge priority={pedido.priority} />
        {guardando && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Prioridad de {pedido.orderNumber}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPCIONES.map(({ valor, etiqueta, icono: Icono }) => {
          const actual = valor === pedido.priority;
          return (
            <DropdownMenuItem key={valor} disabled={actual} onSelect={() => onCambiar(pedido, valor)}>
              <Icono aria-hidden /> {etiqueta}
              {actual && <Check className="ml-auto" aria-label="Prioridad actual" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
