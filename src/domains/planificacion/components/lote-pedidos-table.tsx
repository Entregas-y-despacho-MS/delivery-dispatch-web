import { CalendarCheck, PackageX, Scale, Undo2 } from "lucide-react";
import { cn } from "cn";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import type { PedidoLote } from "../types/lotes.types";
import { formatearFranja } from "../planificacion.format";
import { EstadoPedidoLoteBadge } from "./estado-pedido-lote-badge";

interface LotePedidosTableProps {
  pedidos: PedidoLote[];
  /** Pedidos marcados para sacar: se envían en removeDispatchIds al aprobar. */
  sacados: ReadonlySet<number>;
  /** Sin esto la tabla es de solo lectura (lote ajeno o acción en curso). */
  onSacar?: (pedido: PedidoLote) => void;
  onDevolver?: (dispatchId: number) => void;
  modoRecojo?: boolean;
}

/** Pedidos del lote en orden de visita con su franja propuesta (ST-215.1). */
export function LotePedidosTable({ pedidos, sacados, onSacar, onDevolver, modoRecojo = false }: LotePedidosTableProps) {
  if (pedidos.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">El lote no tiene elementos.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>{modoRecojo ? "Orden de compra" : "Pedido"}</TableHead>
            <TableHead>{modoRecojo ? "Proveedor" : "Dirección"}</TableHead>
            <TableHead>{modoRecojo ? "Ventana de recojo" : "Franja propuesta"}</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido, indice) => {
            const sacado = sacados.has(pedido.dispatchId);
            // Ya tiene su promesa aprobada: no se puede sacar desde aquí.
            const programado = pedido.status === "scheduled";
            return (
              <TableRow key={pedido.dispatchId} className={cn(sacado && "bg-muted/60 text-muted-foreground")}>
                <TableCell className="tabular-nums">{pedido.sequenceOrder ?? indice + 1}</TableCell>
                <TableCell>
                  <div className={cn("font-medium", sacado && "line-through")}>{pedido.sourceOrderRef}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {sacado
                      ? (
                        <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning">
                          <PackageX aria-hidden /> Se saca al aprobar
                        </Badge>
                      )
                      : programado
                        ? (
                          <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                            <CalendarCheck aria-hidden /> Promesa aprobada
                          </Badge>
                        )
                        : <EstadoPedidoLoteBadge />}
                    {pedido.estimated && (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Scale aria-hidden /> Peso estimado
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-64 whitespace-normal">{pedido.deliveryAddress}</TableCell>
                <TableCell className="tabular-nums">{formatearFranja(pedido.scheduledWindowStart, pedido.scheduledWindowEnd)}</TableCell>
                <TableCell className="text-right">
                  {programado ? null : sacado
                    ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => onDevolver?.(pedido.dispatchId)} disabled={!onDevolver}>
                        <Undo2 aria-hidden /> Devolver
                      </Button>
                    )
                    : (
                      <Button type="button" size="sm" variant="ghost" onClick={() => onSacar?.(pedido)} disabled={!onSacar}>
                        <PackageX aria-hidden /> Sacar
                      </Button>
                    )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
