import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface PedidoASacar {
  id: number;
  orderNumber: string;
  recipient: string | null;
}

interface SacarPedidoDialogProps {
  /** Pedido a sacar. null = el modal está cerrado. */
  pedido: PedidoASacar | null;
  onOpenChange: (abierto: boolean) => void;
  onConfirmar: (id: number) => void;
}

/**
 * Confirmación para sacar un pedido del lote (ST-215.1, escenario 2).
 * El back no tiene una acción aparte: el pedido queda marcado y se envía en `removeDispatchIds`
 * al aprobar, donde vuelve a `pending`, sin correo y auditado.
 */
export function SacarPedidoDialog({ pedido, onOpenChange, onConfirmar }: SacarPedidoDialogProps) {
  return (
    <Dialog open={pedido !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {pedido && (
          <>
            <DialogHeader>
              <DialogTitle>Sacar {pedido.orderNumber} del lote</DialogTitle>
              <DialogDescription>
                {pedido.recipient ? `El pedido de ${pedido.recipient}` : "El pedido"} no se aprobará con este lote.
              </DialogDescription>
            </DialogHeader>

            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Al aprobar el lote, vuelve a la bandeja de pendientes para planificarlo de nuevo.</li>
              <li>El cliente no recibe ningún correo.</li>
              <li>El movimiento queda registrado en la auditoría del lote.</li>
              <li>Mientras no apruebes, puedes devolverlo al lote.</li>
            </ul>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={() => onConfirmar(pedido.id)}>
                Sacar del lote
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
