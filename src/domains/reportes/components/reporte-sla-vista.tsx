import { BarChart3 } from "lucide-react";

import { AsyncState } from "@/shared/components/feedback/async-state";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { mensajeErrorSla } from "../reportes.reglas";
import type { ReporteSla } from "../types/reportes.types";
import { GraficoTiemposPorGrupo, MedidorCumplimiento } from "./grafico-cumplimiento";
import { ResumenSla } from "./resumen-sla";
import { TablaSla } from "./tabla-sla";

interface ReporteSlaVistaProps {
  reporte: ReporteSla | undefined;
  cargando: boolean;
  error?: unknown;
  onReintentar: () => void;
  reintentando: boolean;
}

function CargandoReporte() {
  return (
    <div className="space-y-4" aria-label="Cargando reporte" role="status">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

/** Carga, error con reintento, vacío («Sin datos para el período seleccionado») y el reporte. */
export function ReporteSlaVista({ reporte, cargando, error, onReintentar, reintentando }: ReporteSlaVistaProps) {
  if (error != null && !cargando) {
    return <ErrorAlert error={error} description={mensajeErrorSla(parseApiError(error))} onRetry={onReintentar} isRetrying={reintentando} />;
  }
  return (
    <AsyncState
      loading={cargando || !reporte}
      empty={(reporte?.rows.length ?? 0) === 0}
      loadingFallback={<CargandoReporte />}
      emptyFallback={(
        <EmptyState
          icon={<BarChart3 className="size-6" aria-hidden />}
          title="Sin datos para el período seleccionado"
          description="Ningún despacho de entrega se cerró en esas fechas. Prueba con otro período."
        />
      )}
    >
      {reporte && (
        <div className="space-y-6">
          <ResumenSla totales={reporte.totals} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <MedidorCumplimiento totales={reporte.totals} />
            <GraficoTiemposPorGrupo filas={reporte.rows} agrupacion={reporte.groupBy} />
          </div>
          <TablaSla filas={reporte.rows} totales={reporte.totals} agrupacion={reporte.groupBy} />
        </div>
      )}
    </AsyncState>
  );
}
