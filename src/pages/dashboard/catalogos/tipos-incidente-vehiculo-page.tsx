import { CarFront, Plus } from "lucide-react";

import {
  TipoIncidenteVehiculoForm,
  TiposIncidenteVehiculoFilters,
  TiposIncidenteVehiculoTable,
  useTiposIncidenteVehiculoScreen,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export default function TiposIncidenteVehiculoPage() {
  const screen = useTiposIncidenteVehiculoScreen();
  const { tipos } = screen;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos · Flota"
        title="Fallas mecánicas"
        icon={CarFront}
        description="Clasifica los incidentes de vehículos por severidad y define cuáles bloquean la unidad."
        action={<Button onClick={screen.openCreate}><Plus aria-hidden /> Nuevo tipo de falla</Button>}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5"
        aria-label="Catálogo de fallas mecánicas">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold">Tipos de falla</h2>
            <p className="text-sm text-muted-foreground">
              {tipos.isLoading ? "Cargando tipos de falla…" : tipos.isError
                ? "No se pudo consultar el catálogo"
                : `${tipos.total} ${tipos.total === 1 ? "tipo encontrado" : "tipos encontrados"}`}
            </p>
          </div>
          <TiposIncidenteVehiculoFilters search={screen.search} onSearchChange={screen.setSearch}
            severity={screen.severityFilter} onSeverityChange={screen.setSeverityFilter}
            blocking={screen.blockingFilter} onBlockingChange={screen.setBlockingFilter} />
        </div>

        {tipos.isError ? (
          <ErrorAlert error={tipos.error} onRetry={() => tipos.refetch()} className="mt-4" />
        ) : (
          <div className="mt-4" aria-busy={tipos.isFetching}>
            {tipos.isFetching && !tipos.isLoading && (
              <p className="mb-3 text-sm text-muted-foreground" role="status">Actualizando tipos de falla…</p>
            )}
            <TiposIncidenteVehiculoTable data={tipos.data} loading={tipos.isLoading}
              searchActive={screen.hasFilters} onClearFilters={screen.clearFilters}
              onEdit={screen.openEdit} busy={tipos.isSaving} />
          </div>
        )}

        {!tipos.isError && !tipos.isLoading && tipos.total > 0 && (
          <PaginationControls page={screen.page} totalPages={screen.totalPages} reportedPage={tipos.page}
            total={tipos.total} busy={tipos.isFetching} onPageChange={screen.setPage} />
        )}
      </section>

      <Dialog open={screen.dialogOpen} onOpenChange={screen.closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{screen.editingTipo ? "Editar tipo de falla" : "Nuevo tipo de falla"}</DialogTitle>
            <DialogDescription>
              Define la severidad y si esta falla impide asignar nuevos despachos al vehículo.
            </DialogDescription>
          </DialogHeader>
          <TipoIncidenteVehiculoForm key={screen.editingTipo?.id ?? "new"} tipo={screen.editingTipo}
            onSubmit={screen.saveTipo} onCancel={() => screen.closeDialog(false)}
            onDirtyChange={screen.setFormDirty} guardando={tipos.isSaving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
