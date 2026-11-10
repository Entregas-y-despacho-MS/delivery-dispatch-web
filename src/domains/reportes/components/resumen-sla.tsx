import { cumpleUmbral, formatoMinutos, formatoPorcentaje, UMBRAL_SLA_PORCENTAJE } from "../reportes.reglas";
import type { MetricasSla } from "../types/reportes.types";
import { IndicadorCard } from "./indicador-card";

/** Cifras globales del período (los `totals` del back). */
export function ResumenSla({ totales }: { totales: MetricasSla }) {
  const cumple = cumpleUmbral(totales.onTimePercentage);
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen del período">
      <IndicadorCard
        titulo="Entregas a tiempo"
        valor={formatoPorcentaje(totales.onTimePercentage)}
        detalle={`${totales.onTimeCount} de ${totales.deliveredCount} entregados · umbral ${UMBRAL_SLA_PORCENTAJE} %`}
        tono={totales.deliveredCount === 0 ? undefined : cumple ? "ok" : "alerta"}
      />
      <IndicadorCard titulo="Despachos cerrados" valor={String(totales.closedCount)} detalle={`${totales.deliveredCount} entregados · ${totales.lateCount} con demora`} />
      <IndicadorCard titulo="Demora promedio" valor={formatoMinutos(totales.averageDelayMinutes)} detalle="Solo de los que llegaron tarde" />
      <IndicadorCard titulo="Ciclo promedio" valor={formatoMinutos(totales.averageCycleMinutes)} detalle={`Salida a entrega · ${totales.incidentCount} incidencias`} />
    </dl>
  );
}
