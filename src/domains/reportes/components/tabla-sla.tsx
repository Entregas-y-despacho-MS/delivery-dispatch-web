import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { cumpleUmbral, etiquetaAgrupacion, filasPorDemora, formatoMinutos, formatoPorcentaje, nombreGrupo } from "../reportes.reglas";
import type { AgrupacionSla, FilaSla, MetricasSla } from "../reportes.types";

const NUM = "text-right tabular-nums";

function Celdas({ m }: { m: MetricasSla }) {
  const tono = m.deliveredCount === 0 ? undefined : cumpleUmbral(m.onTimePercentage) ? "text-success" : "text-destructive";
  return (
    <>
      <TableCell className={NUM}>{m.closedCount}</TableCell>
      <TableCell className={NUM}>{m.deliveredCount}</TableCell>
      <TableCell className={cn(NUM, "font-medium", tono)}>{formatoPorcentaje(m.onTimePercentage)}</TableCell>
      <TableCell className={NUM}>{m.lateCount}</TableCell>
      <TableCell className={NUM}>{formatoMinutos(m.averageDelayMinutes)}</TableCell>
      <TableCell className={NUM}>{formatoMinutos(m.averageCycleMinutes)}</TableCell>
      <TableCell className={NUM}>{m.incidentCount}</TableCell>
    </>
  );
}

interface TablaSlaProps {
  filas: readonly FilaSla[];
  totales: MetricasSla;
  agrupacion: AgrupacionSla;
}

/** Detalle por grupo, de mayor a menor demora promedio, con la fila de totales. */
export function TablaSla({ filas, totales, agrupacion }: TablaSlaProps) {
  const grupo = etiquetaAgrupacion(agrupacion);
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableCaption className="mb-3">Ordenado de mayor a menor demora promedio.</TableCaption>
        <TableHeader>
          <TableRow>
            {agrupacion === "zone_service" ? <><TableHead scope="col">Zona</TableHead><TableHead scope="col">Servicio</TableHead></> : <TableHead scope="col">{grupo}</TableHead>}
            <TableHead scope="col" className="text-right">Cerrados</TableHead>
            <TableHead scope="col" className="text-right">Entregados</TableHead>
            <TableHead scope="col" className="text-right">A tiempo</TableHead>
            <TableHead scope="col" className="text-right">Con demora</TableHead>
            <TableHead scope="col" className="text-right">Demora prom.</TableHead>
            <TableHead scope="col" className="text-right">Ciclo prom.</TableHead>
            <TableHead scope="col" className="text-right">Incidencias</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filasPorDemora(filas).map((fila) => (
            <TableRow key={fila.groupKey ?? fila.groupId ?? "sin-grupo"}>
              {agrupacion === "zone_service" ? (
                <><TableHead scope="row" className="font-medium">{fila.zoneName ?? "Sin zona"}</TableHead><TableCell>{fila.serviceLevelName ?? "Sin nivel"}</TableCell></>
              ) : (
                <TableHead scope="row" className={cn("font-medium", fila.groupName === null && "italic text-muted-foreground")}>
                  {nombreGrupo(fila, agrupacion)}
                </TableHead>
              )}
              <Celdas m={fila} />
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead scope="row" className="font-semibold">Total</TableHead>
            <Celdas m={totales} />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
