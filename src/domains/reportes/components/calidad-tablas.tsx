import { ArrowDownUp } from "lucide-react";
import { Link } from "react-router-dom";

import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { Button } from "@/shared/components/ui/button";
import { ND, formatearMinutos, type ReporteCalidad } from "../reportes.calidad";

const ESTADOS_CASO: Record<string, string> = {
  received: "Recibido",
  assigned: "Asignado",
  in_investigation: "En investigación",
  decided: "Con dictamen",
};

interface CalidadTablasProps {
  reporte: ReporteCalidad;
  pagina: number;
  orden: "asc" | "desc";
  ocupado: boolean;
  onPagina: (pagina: number) => void;
  onOrden: (orden: "asc" | "desc") => void;
}

/**
 * Casos y despachos, aparte y con los mismos filtros que los KPIs (ST-300.3). Sin datos personales ni evidencia;
 * el caso abre la bandeja de reclamos y el despacho su detalle, que aplican sus propios permisos.
 */
export function CalidadTablas({ reporte, pagina, orden, ocupado, onPagina, onOrden }: CalidadTablasProps) {
  const { cases, dispatches } = reporte.tables;
  const paginas = Math.max(cases.meta.pages, dispatches.meta.pages, 1);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => onOrden(orden === "desc" ? "asc" : "desc")}>
          <ArrowDownUp aria-hidden /> {orden === "desc" ? "Más recientes primero" : "Más antiguos primero"}
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-2" aria-label="Casos de reclamo">
          <h3 className="text-sm font-semibold">Casos de reclamo <span className="font-normal text-muted-foreground">(n = {cases.meta.total})</span></h3>
          {cases.data.length === 0 ? <p className="text-sm text-muted-foreground">Sin casos con esos filtros.</p> : (
            <table className="w-full text-sm" aria-label="Casos">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-1.5 pr-2 font-medium">Caso</th><th className="py-1.5 pr-2 font-medium">Motivo</th><th className="py-1.5 pr-2 font-medium">Estado</th><th className="py-1.5 font-medium">Antigüedad</th></tr>
              </thead>
              <tbody>
                {cases.data.map((c) => (
                  <tr key={c.caseId} className="border-t">
                    <td className="py-1.5 pr-2"><Link className="font-medium text-primary hover:underline" to={`/app/reclamos?caso=${c.caseId}`}>#{c.caseId}</Link></td>
                    <td className="py-1.5 pr-2 font-mono text-xs">{c.reasonCode}</td>
                    <td className="py-1.5 pr-2">{ESTADOS_CASO[c.investigationStatus] ?? c.investigationStatus}</td>
                    <td className="py-1.5 tabular-nums">{c.open ? (c.ageMinutes === null ? ND : `abierto ${formatearMinutos(c.ageMinutes)}`) : "cerrado"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="space-y-2" aria-label="Despachos">
          <h3 className="text-sm font-semibold">Despachos <span className="font-normal text-muted-foreground">(n = {dispatches.meta.total})</span></h3>
          {dispatches.data.length === 0 ? <p className="text-sm text-muted-foreground">Sin despachos con esos filtros.</p> : (
            <table className="w-full text-sm" aria-label="Despachos de la cohorte">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-1.5 pr-2 font-medium">Despacho</th><th className="py-1.5 pr-2 font-medium">Intentos</th><th className="py-1.5 pr-2 font-medium">Con incidencia</th><th className="py-1.5 font-medium">Reprogramado</th></tr>
              </thead>
              <tbody>
                {dispatches.data.map((d) => (
                  <tr key={d.dispatchId} className="border-t">
                    <td className="py-1.5 pr-2"><Link className="font-medium text-primary hover:underline" to={`/app/despachos/${d.dispatchId}`}>#{d.dispatchId}</Link></td>
                    <td className="py-1.5 pr-2 tabular-nums">{d.reconstructable ? d.attemptCount : ND}</td>
                    <td className="py-1.5 pr-2 tabular-nums">{d.reconstructable ? d.attemptsWithIncidentCount : ND}</td>
                    <td className="py-1.5">{d.rescheduled ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      {paginas > 1 && <PaginationControls page={pagina} totalPages={paginas} onPageChange={onPagina} busy={ocupado} />}
    </div>
  );
}
