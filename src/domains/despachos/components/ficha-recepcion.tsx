import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { formatearFechaHoraExacta } from "../despacho-detalle.format";
import { formatearCantidad, itemConDiferencia, nombreItemRecepcion, totalesRecepcion } from "../recepcion.reglas";
import type { RecepcionAlmacen } from "../recepcion.types";
import { ResultadoRecepcionBadge } from "./resultado-recepcion-badge";

/**
 * «Recepción en almacén» de la ficha (ST-240.5): resultado, fecha, notas y la tabla de ítems con lo
 * aceptado, faltante y dañado. Los ítems con diferencias se resaltan.
 */
export function FichaRecepcion({ recepcion }: { recepcion: RecepcionAlmacen }) {
  const totales = totalesRecepcion(recepcion.items);

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-label="Recepción en almacén">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">Recepción en almacén</h3>
        <ResultadoRecepcionBadge resultado={recepcion.result} />
        <span className="text-xs text-muted-foreground">
          Recibido el <time dateTime={recepcion.receivedAt}>{formatearFechaHoraExacta(recepcion.receivedAt)}</time>
        </span>
      </div>

      {recepcion.notes && <p className="text-sm">{recepcion.notes}</p>}

      {recepcion.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">El almacén no envió el detalle de los ítems.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {`${formatearCantidad(totales.aceptados)} aceptados · ${formatearCantidad(totales.faltantes)} faltantes · ${formatearCantidad(totales.danados)} dañados`}
          </p>
          <div className="overflow-x-auto rounded-md border">
            <Table aria-label="Ítems recibidos">
              <TableHeader>
                <TableRow>
                  <TableHead>Ítem</TableHead>
                  <TableHead className="text-right">Aceptados</TableHead>
                  <TableHead className="text-right">Faltantes</TableHead>
                  <TableHead className="text-right">Dañados</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recepcion.items.map((item, indice) => {
                  const diferencia = itemConDiferencia(item);
                  return (
                    <TableRow key={`${item.itemCode ?? item.packageId ?? "item"}-${indice}`} className={cn(diferencia && "bg-warning/5")}>
                      <TableCell className="font-medium">{nombreItemRecepcion(item)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatearCantidad(item.acceptedQuantity)}</TableCell>
                      <TableCell className={cn("text-right tabular-nums", item.missingQuantity > 0 && "font-semibold text-warning")}>
                        {formatearCantidad(item.missingQuantity)}
                      </TableCell>
                      <TableCell className={cn("text-right tabular-nums", item.damagedQuantity > 0 && "font-semibold text-destructive")}>
                        {formatearCantidad(item.damagedQuantity)}
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-normal text-sm text-muted-foreground">{item.detail ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}
