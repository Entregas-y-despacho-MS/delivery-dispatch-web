import { Gauge, LoaderCircle } from "lucide-react";

import {
  BarrasPorVehiculo,
  RankingRepartidores,
  SelectorPeriodoKpi,
  TarjetasKpi,
  PERIODOS_KPI,
  sinDatosKpi,
  textoRangoKpi,
  useIndicadoresFlota,
} from "@/domains/reportes";
import { PageHeader } from "@/shared/components/common/page-header";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";

/** Tablero de KPIs de la flota (ST-61.2, RF-A14): % a tiempo, entregas, incidencias, ranking y vehículos. */
export default function KpisPortalPage() {
  const { periodo, setPeriodo, indicadores } = useIndicadoresFlota();
  const datos = indicadores.data;
  const etiqueta = PERIODOS_KPI.find((p) => p.valor === periodo)?.etiqueta ?? "";
  // Al cambiar de período se sigue viendo el anterior hasta que llegue el nuevo.
  const actualizando = indicadores.isFetching && indicadores.isPlaceholderData;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supervisión"
        title="KPIs de flota"
        icon={Gauge}
        description="Entregas a tiempo, incidencias por repartidor y desempeño de cada vehículo en el período."
      />

      <div className="flex flex-wrap items-center gap-3">
        <SelectorPeriodoKpi periodo={periodo} onCambiar={setPeriodo} />
        {datos && !actualizando && (
          <span className="text-sm text-muted-foreground">{etiqueta}: {textoRangoKpi(datos.from, datos.to)}</span>
        )}
        {actualizando && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden /> Actualizando…
          </span>
        )}
      </div>

      {indicadores.isPending ? (
        <div role="status" aria-label="Cargando indicadores" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
          <Skeleton className="h-72 rounded-lg" />
        </div>
      ) : indicadores.isError || !datos ? (
        <ErrorAlert
          error={indicadores.error}
          title="No pudimos cargar los indicadores"
          onRetry={() => indicadores.refetch()}
          isRetrying={indicadores.isFetching}
        />
      ) : sinDatosKpi(datos) ? (
        <EmptyState
          title="Sin datos para el período seleccionado"
          description="No hay despachos de entrega cerrados en este período. Prueba con otro."
        />
      ) : (
        <div className={actualizando ? "space-y-6 opacity-60 transition-opacity" : "space-y-6"} aria-busy={actualizando}>
          <TarjetasKpi totales={datos.totals} />
          <div className="grid gap-6 xl:grid-cols-2">
            <RankingRepartidores filas={datos.drivers} />
            <BarrasPorVehiculo filas={datos.vehicles} />
          </div>
        </div>
      )}
    </div>
  );
}
