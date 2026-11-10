import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { AGRUPACIONES_SLA, MENSAJE_RANGO, type ProblemaRango } from "../reportes.reglas";
import type { AgrupacionSla } from "../types/reportes.types";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface FiltroPeriodoSlaProps {
  desde: string;
  onDesdeChange: (valor: string) => void;
  hasta: string;
  onHastaChange: (valor: string) => void;
  agrupacion: AgrupacionSla;
  onAgrupacionChange: (valor: AgrupacionSla) => void;
  /** Rango vacío, invertido o de más de 366 días: se avisa y no se consulta. */
  problemaRango: ProblemaRango | null;
  onRefrescar: () => void;
  refrescando: boolean;
  /** Botones de exportación. */
  acciones?: ReactNode;
}

/** Período (desde/hasta, días de Bolivia) y agrupación del reporte de cumplimiento SLA. */
export function FiltroPeriodoSla(props: FiltroPeriodoSlaProps) {
  const { desde, onDesdeChange, hasta, onHastaChange, agrupacion, onAgrupacionChange, problemaRango, onRefrescar, refrescando, acciones } = props;
  const invalido = problemaRango !== null || undefined;
  const descripcion = problemaRango ? "sla-rango-error" : undefined;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="sla-desde" className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input id="sla-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => onDesdeChange(e.target.value)}
            aria-invalid={invalido} aria-describedby={descripcion} />
        </div>
        <div className="space-y-1">
          <label htmlFor="sla-hasta" className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input id="sla-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => onHastaChange(e.target.value)}
            aria-invalid={invalido} aria-describedby={descripcion} />
        </div>
        <div className="space-y-1">
          <label htmlFor="sla-agrupar" className="text-xs font-medium text-muted-foreground">Agrupar por</label>
          <select id="sla-agrupar" className={CLASE_SELECT} value={agrupacion} onChange={(e) => onAgrupacionChange(e.target.value as AgrupacionSla)}>
            {AGRUPACIONES_SLA.map((a) => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
          </select>
        </div>
      </div>
      {problemaRango && (
        <p id="sla-rango-error" role="alert" className="text-sm text-destructive">{MENSAJE_RANGO[problemaRango]}</p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="h-10" onClick={onRefrescar} disabled={refrescando || problemaRango !== null}>
          <RotateCw className={cn("size-4", refrescando && "animate-spin")} aria-hidden />
          {refrescando ? "Actualizando…" : "Actualizar"}
        </Button>
        {acciones}
      </div>
    </div>
  );
}
