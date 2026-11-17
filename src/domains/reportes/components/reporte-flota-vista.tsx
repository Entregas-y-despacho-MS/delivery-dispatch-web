import { Truck } from "lucide-react";

import { AsyncState } from "@/shared/components/feedback/async-state";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { mensajeErrorFlota, sinDatosFlota, vehiculosConEntregas, type ReporteFlota } from "../reportes.flota";
import { BarrasPorVehiculo } from "./indicadores-flota";
import { TablaRepartidoresFlota, TablaVehiculosFlota } from "./tablas-flota";

interface ReporteFlotaVistaProps {
  reporte: ReporteFlota | undefined;
  cargando: boolean;
  error?: unknown;
  onReintentar: () => void;
  reintentando: boolean;
}

function CargandoReporteFlota() {
  return (
    <div className="space-y-4" aria-label="Cargando reporte de flota" role="status">
      <Skeleton className="h-56" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

/** Carga, error con reintento, vacío («Sin datos para el período seleccionado») y el reporte. */
export function ReporteFlotaVista({ reporte, cargando, error, onReintentar, reintentando }: ReporteFlotaVistaProps) {
  if (error != null && !cargando) {
    return <ErrorAlert error={error} description={mensajeErrorFlota(parseApiError(error))} onRetry={onReintentar} isRetrying={reintentando} />;
  }
  const conEntregas = reporte ? vehiculosConEntregas(reporte.vehicles) : [];
  return (
    <AsyncState
      loading={cargando || !reporte}
      empty={!reporte || sinDatosFlota(reporte)}
      loadingFallback={<CargandoReporteFlota />}
      emptyFallback={(
        <EmptyState
          icon={<Truck className="size-6" aria-hidden />}
          title="Sin datos para el período seleccionado"
          description="Ningún despacho se cerró ni hubo mantenimientos en esas fechas. Prueba con otro período."
        />
      )}
    >
      {reporte && (
        <div className="space-y-6">
          {conEntregas.length > 0 && <BarrasPorVehiculo filas={conEntregas} />}
          <div className="grid gap-4 xl:grid-cols-2">
            <TablaVehiculosFlota filas={reporte.vehicles} />
            <TablaRepartidoresFlota filas={reporte.drivers} />
          </div>
        </div>
      )}
    </AsyncState>
  );
}
