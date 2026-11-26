import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { useReporteCalidad } from "../hooks/use-reporte-calidad";
import { mensajeErrorCalidad } from "../reportes.calidad";
import { CalidadFiltros, type OpcionCatalogo } from "./calidad-filtros";
import { CalidadDetalles, CalidadIndicadores } from "./calidad-indicadores";
import { CalidadTablas } from "./calidad-tablas";
import { FiltroRangoFlota } from "./filtro-rango-flota";

interface ReporteCalidadPanelProps {
  zonas: OpcionCatalogo[];
  motivosIncidencia: OpcionCatalogo[];
  habilitado?: boolean;
}

/** Dashboard 4: calidad de la entrega, incidencias, reprogramaciones, reclamos y experiencia (ST-300.3, ES-300). */
export function ReporteCalidadPanel({ zonas, motivosIncidencia, habilitado = true }: ReporteCalidadPanelProps) {
  const calidad = useReporteCalidad({ habilitado });
  const { filtros, problema, reporte } = calidad;
  const datos = reporte.data;

  return (
    <section className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="calidad-titulo">
      <div className="space-y-1">
        <h2 id="calidad-titulo" className="text-lg font-semibold text-brand-blue">Calidad y reclamos</h2>
        <p className="text-sm text-muted-foreground">
          Incidencias y reprogramaciones se ubican por el fin de la franja prometida; reclamos y calificaciones, por el cierre de la entrega. Días de Bolivia.
        </p>
      </div>
      <div className="space-y-3 border-b pb-4">
        <FiltroRangoFlota desde={filtros.desde} onDesdeChange={calidad.setDesde} hasta={filtros.hasta} onHastaChange={calidad.setHasta}
          problemaRango={problema} onRefrescar={() => void reporte.refetch()} refrescando={reporte.isFetching} />
        <CalidadFiltros filtros={filtros} zonas={zonas} motivosIncidencia={motivosIncidencia} onCambiar={calidad.actualizar} onLimpiar={calidad.limpiarFiltros} />
      </div>

      {problema !== null ? null : reporte.isError ? (
        <ErrorAlert title="No pudimos cargar la calidad" error={reporte.error}
          description={mensajeErrorCalidad(parseApiError(reporte.error))}
          onRetry={() => reporte.refetch()} isRetrying={reporte.isFetching} />
      ) : !datos ? (
        <div className="space-y-3" role="status" aria-label="Cargando calidad">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : (
        <div className={reporte.isPlaceholderData ? "space-y-5 opacity-60" : "space-y-5"} aria-busy={reporte.isFetching}>
          <CalidadIndicadores reporte={datos} />
          <CalidadDetalles reporte={datos} />
          <CalidadTablas reporte={datos} pagina={filtros.pagina} orden={filtros.orden} ocupado={reporte.isFetching}
            onPagina={calidad.setPagina} onOrden={(orden) => calidad.actualizar({ orden })} />
        </div>
      )}
    </section>
  );
}
