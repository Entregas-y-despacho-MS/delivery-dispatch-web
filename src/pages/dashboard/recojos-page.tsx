import { useState } from "react";
import { PackageOpen, Plus } from "lucide-react";

import {
  AnularRecojoDialog,
  NuevoRecojoDialog,
  RecojosFiltros,
  RecojosTable,
  hayFiltrosRecojos,
  useAccionesRecojo,
  useRecojos,
  type Recojo,
} from "@/domains/despachos";
import { hasRole, ROLES } from "@/config/roles";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { useAuthStore } from "@/shared/store/use-auth-store";

/**
 * Órdenes de recojo de devolución (ST-81.1, RF-A39). Registrar y anular son solo del coordinador; a
 * cualquier otro rol la página se le muestra en solo lectura (sin «Nuevo recojo» ni «Anular»).
 */
export default function RecojosPage() {
  const roleId = useAuthStore((state) => state.user?.rol.id);
  const puedeGestionar = hasRole(roleId, [ROLES.COORDINADOR]);
  const recojos = useRecojos();
  const acciones = useAccionesRecojo();
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [porAnular, setPorAnular] = useState<Recojo | null>(null);
  const { filtros, listado } = recojos;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Órdenes de recojo"
        icon={PackageOpen}
        description="Devoluciones para recoger donde el cliente: las que llegan por RMA y las que registra el coordinador."
        action={puedeGestionar ? (
          <Button onClick={() => setNuevoAbierto(true)}>
            <Plus aria-hidden /> Nuevo recojo
          </Button>
        ) : undefined}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Listado de recojos">
        <div className="border-b pb-4">
          <RecojosFiltros
            filtros={filtros}
            rangoInvertido={recojos.rangoInvertido}
            onEstadoChange={recojos.setEstado}
            onOrigenChange={recojos.setOrigen}
            onDesdeChange={recojos.setDesde}
            onHastaChange={recojos.setHasta}
            onLimpiar={recojos.limpiarFiltros}
          />
        </div>

        {listado.isError ? (
          <ErrorAlert error={listado.error} title="No pudimos cargar los recojos" onRetry={() => listado.refetch()}
            isRetrying={listado.isFetching} className="mt-4" />
        ) : (
          <div className="mt-4">
            <RecojosTable
              data={recojos.recojos}
              loading={listado.isLoading}
              filtrado={hayFiltrosRecojos(filtros)}
              onLimpiarFiltros={recojos.limpiarFiltros}
              onAnular={puedeGestionar ? setPorAnular : undefined}
            />
          </div>
        )}

        {!listado.isError && !listado.isLoading && recojos.total > 0 && (
          <PaginationControls page={filtros.pagina} totalPages={recojos.paginas} reportedPage={listado.data?.meta.page}
            onPageChange={recojos.setPagina} busy={listado.isFetching} />
        )}
      </section>

      {puedeGestionar && nuevoAbierto && (
        <NuevoRecojoDialog abierto onOpenChange={setNuevoAbierto} onCrear={acciones.crear} creando={acciones.creando} />
      )}
      {puedeGestionar && (
        <AnularRecojoDialog
          recojo={porAnular}
          onCerrar={() => setPorAnular(null)}
          onConfirmar={acciones.anular}
          anulando={acciones.anulando}
        />
      )}
    </div>
  );
}
