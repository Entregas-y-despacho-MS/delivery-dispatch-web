import { BarChart3, Lock } from "lucide-react";

import { hasRole, ROLES } from "@/config/roles";
import { ExportarReporteSla, FiltroPeriodoSla, ReporteSlaVista, useReporteSla } from "@/domains/reportes";
import { PageHeader } from "@/shared/components/common/page-header";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useAuthStore } from "@/shared/store/use-auth-store";

/** Reportes de cumplimiento (ST-54.1, RF-A07). El back solo responde al coordinador (y root). */
export default function ReportesPage() {
  const rolId = useAuthStore((s) => s.user?.rol.id);
  const puedeVer = hasRole(rolId, [ROLES.COORDINADOR]);
  const sla = useReporteSla({ habilitado: puedeVer });
  const { filtros, reporte } = sla;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control"
        title="Reportes"
        icon={BarChart3}
        description="Cumplimiento de entregas frente a la franja comprometida (SLA)."
      />

      {!puedeVer ? (
        <EmptyState
          icon={<Lock className="size-6" aria-hidden />}
          title="Reporte disponible solo para el Coordinador"
          description="El reporte de cumplimiento SLA lo consulta el Coordinador de Despachos."
        />
      ) : (
        <section className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="sla-titulo">
          <div className="space-y-1">
            <h2 id="sla-titulo" className="text-lg font-semibold text-brand-blue">Cumplimiento de SLA</h2>
            <p className="text-sm text-muted-foreground">
              Solo cuenta despachos de entrega cerrados en el período; los cancelados no entran. Las cifras pueden tardar hasta 10 minutos en reflejar una entrega recién confirmada.
            </p>
          </div>
          <div className="border-b pb-4">
            <FiltroPeriodoSla
              desde={filtros.desde}
              onDesdeChange={sla.setDesde}
              hasta={filtros.hasta}
              onHastaChange={sla.setHasta}
              agrupacion={filtros.agrupacion}
              onAgrupacionChange={sla.setAgrupacion}
              problemaRango={sla.problemaRango}
              onRefrescar={sla.refrescar}
              refrescando={reporte.isFetching}
              acciones={(
                <ExportarReporteSla
                  reporte={reporte.data}
                  deshabilitado={sla.problemaRango !== null || reporte.isFetching || reporte.isError}
                />
              )}
            />
          </div>

          {sla.problemaRango === null && (
            <div aria-busy={reporte.isFetching}>
              <ReporteSlaVista
                reporte={reporte.data}
                cargando={reporte.isLoading}
                error={reporte.isError ? reporte.error : undefined}
                onReintentar={sla.refrescar}
                reintentando={reporte.isFetching}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
