import { MessageSquareWarning } from "lucide-react";

import { useZonas } from "@/domains/catalogos";
import {
  ReclamoDetalleSheet,
  ReclamosFiltros,
  ReclamosTabla,
  hayFiltrosReclamos,
  mensajeErrorReclamos,
  useReclamos,
} from "@/domains/reclamos";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { parseApiError } from "@/shared/lib/api-error";
import { useAuthStore } from "@/shared/store/use-auth-store";

const ZONAS_PARAMS = { page: 1, limit: 100 };

/** Bandeja y detalle interno de reclamos del CRM (ST-45.3, RF-U22): coordinador y supervisor. */
export default function ReclamosPage() {
  const reclamos = useReclamos();
  const { filtros, bandeja, problema } = reclamos;
  const zonas = useZonas(ZONAS_PARAMS);
  const idUsuario = useAuthStore((s) => s.user?.id);
  const miId = idUsuario && /^\d+$/.test(idUsuario) ? Number(idUsuario) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control"
        title="Reclamos"
        icon={MessageSquareWarning}
        description="Reclamos del CRM sobre despachos entregados: tómalos, investígalos y emite el dictamen. Sin datos del cliente."
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Bandeja de reclamos">
        <div className="border-b pb-4">
          <ReclamosFiltros
            filtros={filtros}
            problema={problema}
            zonas={zonas.data}
            miId={miId}
            onCambiar={reclamos.actualizar}
            onLimpiar={reclamos.limpiarFiltros}
            onRefrescar={() => void bandeja.refetch()}
            refrescando={bandeja.isFetching}
          />
        </div>

        {problema === null && bandeja.isError ? (
          <ErrorAlert
            className="mt-4"
            title="No pudimos cargar los reclamos"
            error={bandeja.error}
            description={mensajeErrorReclamos(parseApiError(bandeja.error))}
            onRetry={() => bandeja.refetch()}
            isRetrying={bandeja.isFetching}
          />
        ) : (
          <div className="mt-4">
            {bandeja.data && problema === null && (
              <p className="mb-2 text-sm text-muted-foreground" role="status">
                {reclamos.total === 1 ? "1 reclamo" : `${reclamos.total} reclamos`} · los más recientes primero
              </p>
            )}
            <ReclamosTabla
              reclamos={problema === null ? reclamos.reclamos : []}
              loading={problema === null && bandeja.isLoading}
              filtrado={hayFiltrosReclamos(filtros)}
              ahora={bandeja.dataUpdatedAt}
              onLimpiarFiltros={reclamos.limpiarFiltros}
              onVerDetalle={reclamos.abrirCaso}
            />
          </div>
        )}

        {problema === null && !bandeja.isError && !bandeja.isLoading && reclamos.total > 0 && (
          <PaginationControls page={filtros.pagina} totalPages={reclamos.paginas} reportedPage={bandeja.data?.meta.page}
            onPageChange={reclamos.setPagina} busy={bandeja.isFetching} />
        )}
      </section>

      <ReclamoDetalleSheet id={reclamos.casoAbierto} miId={miId} onCerrar={reclamos.cerrarCaso} />
    </div>
  );
}
