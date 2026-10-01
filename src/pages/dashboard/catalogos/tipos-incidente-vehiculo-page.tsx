import { CarFront, Plus, Wrench } from "lucide-react";

import {
  TipoIncidenteVehiculoForm,
  TiposIncidenteVehiculoFilters,
  TiposIncidenteVehiculoTable,
  useTiposIncidenteVehiculoScreen,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { SearchField } from "@/shared/components/common/search-field";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";

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
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchField id="fallas-search" label="Buscar tipos de falla" value={screen.search}
            onChange={screen.setSearch} maxLength={100} placeholder="Frenos o MEC-FRE-01"
            className="sm:min-w-56 sm:max-w-sm" />
          <TiposIncidenteVehiculoFilters
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
        <DialogContent data-form-dialog className="form-dialog-content max-h-[90dvh] overflow-y-auto bg-card sm:max-w-2xl motion-reduce:animate-none">
          <FormDialogHeader icon={Wrench}
            title={screen.editingTipo ? "Editar tipo de falla" : "Nuevo tipo de falla"}
            description="Define la severidad y si esta falla impide asignar nuevos despachos al vehículo." />
          <TipoIncidenteVehiculoForm key={screen.editingTipo?.id ?? "new"} tipo={screen.editingTipo}
            onSubmit={screen.saveTipo} onCancel={() => screen.closeDialog(false)}
            onDirtyChange={screen.setFormDirty} guardando={tipos.isSaving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
