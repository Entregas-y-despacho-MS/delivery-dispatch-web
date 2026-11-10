import { Users } from "lucide-react";

import {
  FiltroRangoFlota,
  TablaRepartidoresFlota,
  useReporteFlota,
} from "@/domains/reportes";
import { PageHeader } from "@/shared/components/common/page-header";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";

/** Rendimiento por repartidor desde el reporte de flota existente. */
export default function RepartidoresPage() {
  const flota = useReporteFlota();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flota"
        title="Rendimiento de repartidores"
        icon={Users}
        description="Consulta entregas, cumplimiento, demoras e incidencias por repartidor en un período."
      />

      <section className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Rendimiento por período">
        <FiltroRangoFlota
          desde={flota.filtros.desde}
          onDesdeChange={flota.setDesde}
          hasta={flota.filtros.hasta}
          onHastaChange={flota.setHasta}
          problemaRango={flota.problemaRango}
          onRefrescar={flota.refrescar}
          refrescando={flota.reporte.isFetching}
        />

        {flota.problemaRango ? null : flota.reporte.isError ? (
          <ErrorAlert
            error={flota.reporte.error}
            title="No pudimos cargar el rendimiento de repartidores"
            onRetry={flota.refrescar}
            isRetrying={flota.reporte.isFetching}
          />
        ) : flota.reporte.isLoading ? (
          <div role="status" aria-label="Cargando rendimiento de repartidores">
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : flota.reporte.data ? (
          flota.reporte.data.drivers.length > 0 ? (
            <TablaRepartidoresFlota filas={flota.reporte.data.drivers} />
          ) : (
            <EmptyState
              icon={<Users className="size-6" aria-hidden />}
              title="Sin entregas cerradas en este período"
              description="Cuando haya despachos cerrados con repartidor asignado, aparecerán aquí sus métricas."
            />
          )
        ) : null}
      </section>
    </div>
  );
}
