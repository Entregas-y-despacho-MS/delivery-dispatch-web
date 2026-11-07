import { cumpleUmbral, formatoMinutos, formatoPorcentaje, UMBRAL_SLA_PORCENTAJE } from "../reportes.reglas";
import type { MetricasSla } from "../reportes.types";
import { cn } from "@/shared/lib/utils";

interface IndicadorProps {
  titulo: string;
  valor: string;
  detalle?: string;
  tono?: "ok" | "alerta";
}

function Indicador({ titulo, valor, detalle, tono }: IndicadorProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
      <dd className={cn("mt-1 text-2xl font-semibold tabular-nums", tono === "ok" && "text-success", tono === "alerta" && "text-destructive")}>
        {valor}
      </dd>
      {detalle && <dd className="mt-0.5 text-xs text-muted-foreground">{detalle}</dd>}
    </div>
  );
}

/** Cifras globales del período (los `totals` del back). */
export function ResumenSla({ totales }: { totales: MetricasSla }) {
  const cumple = cumpleUmbral(totales.onTimePercentage);
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen del período">
      <Indicador
        titulo="Entregas a tiempo"
        valor={formatoPorcentaje(totales.onTimePercentage)}
        detalle={`${totales.onTimeCount} de ${totales.deliveredCount} entregados · umbral ${UMBRAL_SLA_PORCENTAJE} %`}
        tono={totales.deliveredCount === 0 ? undefined : cumple ? "ok" : "alerta"}
      />
      <Indicador titulo="Despachos cerrados" valor={String(totales.closedCount)} detalle={`${totales.deliveredCount} entregados · ${totales.lateCount} con demora`} />
      <Indicador titulo="Demora promedio" valor={formatoMinutos(totales.averageDelayMinutes)} detalle="Solo de los que llegaron tarde" />
      <Indicador titulo="Ciclo promedio" valor={formatoMinutos(totales.averageCycleMinutes)} detalle={`Salida a entrega · ${totales.incidentCount} incidencias`} />
    </dl>
  );
}
