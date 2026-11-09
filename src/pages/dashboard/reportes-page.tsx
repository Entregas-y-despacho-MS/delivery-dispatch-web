import { BarChart3, Lock } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { hasRole, ROLES } from "@/config/roles";
import {
  ExportarReporteFlota,
  ExportarReporteSla,
  FiltroPeriodoSla,
  FiltroRangoFlota,
  ReporteFlotaVista,
  ReporteSlaVista,
  useReporteFlota,
  useReporteSla,
} from "@/domains/reportes";
import { PageHeader } from "@/shared/components/common/page-header";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Button } from "@/shared/components/ui/button";
import { useAuthStore } from "@/shared/store/use-auth-store";

type Vista = "sla" | "flota";

const PESTANAS: readonly { valor: Vista; etiqueta: string }[] = [
  { valor: "sla", etiqueta: "Cumplimiento SLA" },
  { valor: "flota", etiqueta: "Flota" },
];

/**
 * Reportes (ST-54.1 RF-A07 y ST-65.2 RF-A18). El SLA lo consulta solo el coordinador; el de flota,
 * el supervisor y el coordinador. El coordinador elige con pestañas (`?vista=flota`); el supervisor
 * solo ve el de flota.
 */
export default function ReportesPage() {
  const rolId = useAuthStore((s) => s.user?.rol.id);
  const esCoordinador = hasRole(rolId, [ROLES.COORDINADOR]);
  const puedeVerFlota = hasRole(rolId, [ROLES.COORDINADOR, ROLES.SUPERVISOR]);
  const [searchParams, setSearchParams] = useSearchParams();
  const vista: Vista = esCoordinador && searchParams.get("vista") !== "flota" ? "sla" : "flota";

  const sla = useReporteSla({ habilitado: esCoordinador && vista === "sla" });
  const flota = useReporteFlota({ habilitado: puedeVerFlota && vista === "flota" });

  const cambiarVista = (siguiente: Vista) =>
    setSearchParams((actuales) => {
      const nuevos = new URLSearchParams(actuales);
      if (siguiente === "flota") nuevos.set("vista", "flota");
      else nuevos.delete("vista");
      return nuevos;
    }, { replace: true });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control"
        title="Reportes"
        icon={BarChart3}
        description={esCoordinador
          ? "Cumplimiento de entregas frente a la franja comprometida (SLA) y rendimiento de la flota."
          : "Rendimiento, incidencias y mantenimientos de la flota por período."}
      />

      {!puedeVerFlota ? (
        <EmptyState
          icon={<Lock className="size-6" aria-hidden />}
          title="Reportes disponibles para el Coordinador y el Supervisor"
          description="Los reportes los consultan el Coordinador de Despachos y el Supervisor de Flota."
        />
      ) : (
        <>
          {esCoordinador && (
            <div role="tablist" aria-label="Tipo de reporte" className="inline-flex rounded-lg border bg-muted/40 p-1">
              {PESTANAS.map(({ valor, etiqueta }) => (
                <Button
                  key={valor}
                  type="button"
                  size="sm"
                  role="tab"
                  aria-selected={vista === valor}
                  variant={vista === valor ? "default" : "ghost"}
                  onClick={() => cambiarVista(valor)}
                >
                  {etiqueta}
                </Button>
              ))}
            </div>
          )}

          {vista === "sla" ? (
            <section className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="sla-titulo">
              <div className="space-y-1">
                <h2 id="sla-titulo" className="text-lg font-semibold text-brand-blue">Cumplimiento de SLA</h2>
                <p className="text-sm text-muted-foreground">
                  Solo cuenta despachos de entrega cerrados en el período; los cancelados no entran. Las cifras pueden tardar hasta 10 minutos en reflejar una entrega recién confirmada.
                </p>
              </div>
              <div className="border-b pb-4">
                <FiltroPeriodoSla
                  desde={sla.filtros.desde}
                  onDesdeChange={sla.setDesde}
                  hasta={sla.filtros.hasta}
                  onHastaChange={sla.setHasta}
                  agrupacion={sla.filtros.agrupacion}
                  onAgrupacionChange={sla.setAgrupacion}
                  problemaRango={sla.problemaRango}
                  onRefrescar={sla.refrescar}
                  refrescando={sla.reporte.isFetching}
                  acciones={(
                    <ExportarReporteSla
                      reporte={sla.reporte.data}
                      deshabilitado={sla.problemaRango !== null || sla.reporte.isFetching || sla.reporte.isError}
                    />
                  )}
                />
              </div>

              {sla.problemaRango === null && (
                <div aria-busy={sla.reporte.isFetching}>
                  <ReporteSlaVista
                    reporte={sla.reporte.data}
                    cargando={sla.reporte.isLoading}
                    error={sla.reporte.isError ? sla.reporte.error : undefined}
                    onReintentar={sla.refrescar}
                    reintentando={sla.reporte.isFetching}
                  />
                </div>
              )}
            </section>
          ) : (
            <section className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="flota-titulo">
              <div className="space-y-1">
                <h2 id="flota-titulo" className="text-lg font-semibold text-brand-blue">Reporte de flota</h2>
                <p className="text-sm text-muted-foreground">
                  Entregas, incidencias y mantenimientos por vehículo y por repartidor. Las cifras pueden tardar hasta 10 minutos en actualizarse.
                </p>
              </div>
              <div className="border-b pb-4">
                <FiltroRangoFlota
                  desde={flota.filtros.desde}
                  onDesdeChange={flota.setDesde}
                  hasta={flota.filtros.hasta}
                  onHastaChange={flota.setHasta}
                  problemaRango={flota.problemaRango}
                  onRefrescar={flota.refrescar}
                  refrescando={flota.reporte.isFetching}
                  acciones={(
                    <ExportarReporteFlota
                      reporte={flota.reporte.data}
                      deshabilitado={flota.problemaRango !== null || flota.reporte.isFetching || flota.reporte.isError}
                    />
                  )}
                />
              </div>

              {flota.problemaRango === null && (
                <div aria-busy={flota.reporte.isFetching}>
                  <ReporteFlotaVista
                    reporte={flota.reporte.data}
                    cargando={flota.reporte.isLoading}
                    error={flota.reporte.isError ? flota.reporte.error : undefined}
                    onReintentar={flota.refrescar}
                    reintentando={flota.reporte.isFetching}
                  />
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
