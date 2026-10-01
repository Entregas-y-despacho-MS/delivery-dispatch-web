import { CalendarClock, ListFilter, Plus, TriangleAlert } from "lucide-react";

import {
  MOTIVO_REPROGRAMACION_CATEGORIAS,
  MotivoReprogramacionForm,
  MotivosReprogramacionTable,
  useMotivosReprogramacionScreen,
  type CategoryFilter,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { ConfirmActionDialog } from "@/shared/components/common/confirm-action-dialog";
import { ActiveStatusFilter } from "@/shared/components/common/active-status-filter";
import { SearchField } from "@/shared/components/common/search-field";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export default function MotivosReprogramacionPage() {
  const screen = useMotivosReprogramacionScreen();
  const { motivos } = screen;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos"
        title="Motivos de reprogramación"
        icon={ListFilter}
        description="Clasifica los motivos que justifican cambios de fecha o transportista en una entrega."
        action={<Button onClick={screen.openCreate}><Plus aria-hidden /> Nuevo motivo</Button>}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Catálogo de motivos de reprogramación">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
            <SearchField id="reprogramacion-search" label="Buscar motivos" value={screen.search}
              onChange={screen.setSearch} placeholder="Solicitud del cliente" maxLength={100}
              className="sm:min-w-56 sm:max-w-sm" />
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
            <Select value={screen.categoryFilter} onValueChange={(value: CategoryFilter) => screen.setCategoryFilter(value)}>
              <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrar por origen"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                {MOTIVO_REPROGRAMACION_CATEGORIAS.map((origin) => (
                  <SelectItem key={origin.value} value={origin.value}>{origin.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ActiveStatusFilter value={screen.statusFilter} onChange={screen.setStatusFilter} />
          </div>
        </div>

        {motivos.isError ? (
          <ErrorAlert error={motivos.error} onRetry={() => motivos.refetch()} className="mt-4" />
        ) : (
          <div className="mt-4" aria-busy={motivos.isFetching}>
            {motivos.isFetching && !motivos.isLoading && (
              <p className="mb-3 text-sm text-muted-foreground" role="status">Actualizando motivos…</p>
            )}
            {screen.listActionError && (
              <Alert variant="destructive" className="mb-4">
                <TriangleAlert aria-hidden /><AlertDescription>{screen.listActionError}</AlertDescription>
              </Alert>
            )}
            <MotivosReprogramacionTable data={motivos.data} loading={motivos.isLoading}
              searchActive={screen.hasFilters} busy={motivos.isSaving}
              onClearFilters={screen.clearFilters} onEdit={screen.openEdit} onToggle={screen.requestToggle} />
          </div>
        )}

        {!motivos.isError && !motivos.isLoading && motivos.total > 0 && (
          <PaginationControls page={screen.page} totalPages={screen.totalPages} reportedPage={motivos.page}
            total={motivos.total} busy={motivos.isFetching} onPageChange={screen.setPage} />
        )}
      </section>

      <Dialog open={screen.dialogOpen} onOpenChange={screen.closeDialog}>
        <DialogContent data-form-dialog className="form-dialog-content max-h-[90dvh] overflow-y-auto bg-card sm:max-w-2xl motion-reduce:animate-none">
          <FormDialogHeader icon={CalendarClock}
            title={screen.editingMotivo ? "Editar motivo" : "Nuevo motivo"}
            description={screen.editingMotivo
              ? "Actualiza los datos del motivo y su categoría."
              : "El motivo quedará activo y disponible para justificar cambios operativos."} />
          <MotivoReprogramacionForm key={screen.editingMotivo?.id ?? "new"}
            motivo={screen.editingMotivo} onSubmit={screen.saveMotivo}
            onCancel={() => screen.closeDialog(false)} onDirtyChange={screen.setFormDirty}
            guardando={motivos.isSaving} />
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog open={!!screen.pendingDeactivate}
        onOpenChange={screen.onConfirmationOpenChange}
        title="Desactivar motivo"
        description={`El motivo ${screen.pendingDeactivate?.name ?? ""} ya no estará disponible para nuevos cambios. Los registros anteriores se conservarán.`}
        confirmLabel="Desactivar motivo" confirmVariant="destructive" busy={motivos.isSaving} error={screen.actionError}
        onConfirm={screen.confirmDeactivate} />
    </div>
  );
}
