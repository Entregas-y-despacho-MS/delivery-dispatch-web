import { ScrollText } from "lucide-react";

import {
  AuditoriaDetalle,
  AuditoriaFiltros,
  AuditoriaTabla,
  ExportarAuditoria,
  hayFiltrosAuditoria,
  mensajeErrorAuditoria,
  useAuditoria,
} from "@/domains/auditoria";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { parseApiError } from "@/shared/lib/api-error";

/** Auditoría de acciones administrativas (ST-70.2, RF-A37): solo administrador y root. */
export default function AuditoriaPage() {
  const auditoria = useAuditoria();
  const { filtros, busqueda, problema } = auditoria;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Auditoría"
        icon={ScrollText}
        description="Quién hizo cada acción administrativa, cuándo, sobre qué y con qué resultado. Horas de Bolivia (UTC−4)."
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Búsqueda de auditoría">
        <div className="border-b pb-4">
          <AuditoriaFiltros
            filtros={filtros}
            problema={problema}
            onCambiar={auditoria.actualizar}
            onLimpiar={auditoria.limpiarFiltros}
            onRefrescar={() => void busqueda.refetch()}
            refrescando={busqueda.isFetching}
          />
          <div className="mt-3">
            <ExportarAuditoria
              params={auditoria.params}
              filtros={filtros}
              total={busqueda.data && !busqueda.isPlaceholderData ? auditoria.total : null}
              deshabilitado={problema !== null || busqueda.isError || busqueda.isLoading}
            />
          </div>
        </div>

        {problema === null && busqueda.isError ? (
          <ErrorAlert
            className="mt-4"
            title="No pudimos cargar la auditoría"
            error={busqueda.error}
            description={mensajeErrorAuditoria(parseApiError(busqueda.error))}
            onRetry={() => busqueda.refetch()}
            isRetrying={busqueda.isFetching}
          />
        ) : (
          <div className="mt-4">
            {busqueda.data && problema === null && (
              <p className="mb-2 text-sm text-muted-foreground" role="status">
                {auditoria.total === 1 ? "1 evento" : `${auditoria.total} eventos`} en el período
              </p>
            )}
            <AuditoriaTabla
              eventos={problema === null ? auditoria.eventos : []}
              loading={problema === null && busqueda.isLoading}
              filtrado={hayFiltrosAuditoria(filtros)}
              onLimpiarFiltros={auditoria.limpiarFiltros}
              onVerDetalle={auditoria.abrirEvento}
            />
          </div>
        )}

        {problema === null && !busqueda.isError && !busqueda.isLoading && auditoria.total > 0 && (
          <PaginationControls page={filtros.pagina} totalPages={auditoria.paginas} reportedPage={busqueda.data?.meta.page}
            onPageChange={auditoria.setPagina} busy={busqueda.isFetching} />
        )}
      </section>

      <AuditoriaDetalle evento={auditoria.eventoSeleccionado} onCerrar={auditoria.cerrarEvento} />
    </div>
  );
}
