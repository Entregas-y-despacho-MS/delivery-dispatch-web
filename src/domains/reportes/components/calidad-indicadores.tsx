import { Info } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import {
  BASES_FECHA,
  KPIS_CALIDAD,
  ND,
  causaNd,
  detalleKpi,
  distribucionPorMotivo,
  formatearMinutos,
  valorKpi,
  type ReporteCalidad,
} from "../reportes.calidad";

/** Seis indicadores con fórmula, numerador/denominador, n y fecha base (ST-300.3). N/D trae su causa. */
export function CalidadIndicadores({ reporte }: { reporte: ReporteCalidad }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicadores de calidad">
      {KPIS_CALIDAD.map(({ clave, titulo, formula }) => {
        const kpi = reporte.kpis[clave];
        const nd = !kpi.available;
        return (
          <div key={clave} className={cn("space-y-1 rounded-lg border bg-card p-4", nd && "border-dashed")}>
            <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{valorKpi(kpi)}</dd>
            <dd className="text-xs tabular-nums text-muted-foreground">{detalleKpi(kpi)}</dd>
            {nd && <dd className="text-xs text-warning">{causaNd(kpi.reason)}</dd>}
            <dd className="flex items-start gap-1 text-[11px] text-muted-foreground" title={kpi.formula}>
              <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
              <span>{formula}. Fecha base: {BASES_FECHA[kpi.dateBasis] ?? kpi.dateBasis}.</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Conteos que se muestran aparte (no entran en ningún numerador) y la distribución por motivo. */
export function CalidadDetalles({ reporte }: { reporte: ReporteCalidad }) {
  const { attempts, reschedules, complaints, attemptCoverage } = reporte.details;
  const distribucion = distribucionPorMotivo(reporte.tables.cases);
  const mayor = distribucion?.[0]?.cantidad ?? 0;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-2 rounded-lg border p-4" aria-label="Conteos del período">
        <h3 className="text-sm font-semibold">Conteos del período</h3>
        <ul className="space-y-1 text-sm">
          <li>{attempts.attemptCount} intentos · {attempts.attemptsWithIncidentCount} con incidencia · {attempts.incidentEventCount} incidencias registradas</li>
          <li>{reschedules.rescheduledDispatchCount} despachos reprogramados de {reschedules.eligibleDispatchCount} elegibles ({reschedules.reassignmentOnlyCount} solo reasignados)</li>
          <li>{complaints.caseCount} casos en {complaints.dispatchesWithCaseCount} de {complaints.deliveredDispatchCount} despachos entregados</li>
          <li>
            {complaints.open.count} casos abiertos
            {complaints.open.oldestAgeMinutes !== null && ` · el más antiguo lleva ${formatearMinutos(complaints.open.oldestAgeMinutes)}`}
            <span className="text-muted-foreground"> (no entran en la mediana)</span>
          </li>
          {attempts.notReconstructableCount > 0 && <li className="text-warning">{attempts.notReconstructableCount} despachos sin intentos reconstruibles</li>}
        </ul>
        {!attemptCoverage.complete && (
          <p className="text-xs text-warning">Los intentos se registran desde {attemptCoverage.from ?? ND}: el período no está completo.</p>
        )}
      </section>
      <section className="space-y-2 rounded-lg border p-4" aria-label="Reclamos por motivo">
        <h3 className="text-sm font-semibold">Reclamos por motivo</h3>
        {distribucion === null ? (
          <p className="text-sm text-muted-foreground">{ND}: hay más casos que los de esta página. Acota el período o filtra por motivo.</p>
        ) : distribucion.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos: no hubo reclamos en el período.</p>
        ) : (
          <ul className="space-y-1.5">
            {distribucion.map(({ motivo, cantidad }) => (
              <li key={motivo} className="space-y-0.5 text-xs">
                <div className="flex justify-between gap-2"><span className="font-mono">{motivo}</span><span className="tabular-nums">{cantidad}</span></div>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${(cantidad / mayor) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
