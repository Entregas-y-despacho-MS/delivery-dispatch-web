import { Mail, Undo2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export interface PedidoDelLote {
  id: number;
  orderNumber: string;
}

interface AprobarPromesasDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  /** Nombre del lote para el título, p. ej. «lote #12» (se lee «Aprobar promesas del lote #12»). */
  titulo: string;
  /** Pedidos que se aprueban: a cada cliente le sale un correo con fecha, franja y enlace. */
  aprobados: PedidoDelLote[];
  /** Pedidos marcados para sacar: vuelven a pendientes sin correo. */
  sacados: PedidoDelLote[];
  aprobando: boolean;
  onConfirmar: () => void;
  modoRecojo?: boolean;
}

/**
 * Confirmación de la 1.ª aprobación (ST-215.1). Antes de aprobar muestra cuántos correos saldrán,
 * porque después el cliente ya recibió su fecha y la promesa no se cambia en silencio.
 */
export function AprobarPromesasDialog({
  abierto,
  onOpenChange,
  titulo,
  aprobados,
  sacados,
  aprobando,
  onConfirmar,
  modoRecojo = false,
}: AprobarPromesasDialogProps) {
  const correos = aprobados.length;

  return (
    <Dialog open={abierto} onOpenChange={(valor) => !aprobando && onOpenChange(valor)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{modoRecojo ? `Confirmar revisión del ${titulo}` : `Aprobar promesas del ${titulo}`}</DialogTitle>
          <DialogDescription>
            {modoRecojo ? "Confirma que revisaste las órdenes de compra, las ventanas acordadas y la capacidad del lote. El recojo no envía una promesa ni un correo al cliente." : "Los pedidos aprobados pasan a programados y cada cliente recibe su fecha y franja."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {!modoRecojo && <p className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 p-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
            <span>Saldrán <strong>{correos} {correos === 1 ? "correo" : "correos"}</strong> a los clientes. Los pedidos sin correo registrado se aprueban igual, pero no reciben aviso.</span>
          </p>}

          {sacados.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
              <Undo2 className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <div>
                <p>
                  {sacados.length === 1 ? (modoRecojo ? "Este recojo vuelve" : "Este pedido vuelve") : (modoRecojo ? "Estos recojos vuelven" : "Estos pedidos vuelven")} {modoRecojo ? "a la cola de programación:" : "a pendientes, sin correo:"}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {sacados.map((pedido) => pedido.orderNumber).join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {/* Cancelar primero: Enter no aprueba por accidente. */}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={aprobando}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirmar} disabled={aprobando || correos === 0}>
            {aprobando ? "Guardando…" : modoRecojo ? "Confirmar revisión" : `Aprobar ${correos} ${correos === 1 ? "pedido" : "pedidos"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
