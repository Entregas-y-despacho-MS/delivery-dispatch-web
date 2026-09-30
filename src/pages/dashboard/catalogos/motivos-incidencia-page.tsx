import { useMemo, useState, type ComponentProps } from "react";
import { ListFilter, ListX, Plus, TriangleAlert } from "lucide-react";

import {
  MotivoIncidenciaForm,
  MotivosIncidenciaTable,
  useMotivosIncidencia,
  type MotivoIncidencia,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { ConfirmActionDialog } from "@/shared/components/common/confirm-action-dialog";
import { ActiveStatusFilter, type ActiveStatusFilterValue } from "@/shared/components/common/active-status-filter";
import { SearchField } from "@/shared/components/common/search-field";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { parseApiError } from "@/shared/lib/api-error";

const PAGE_SIZE = 10;
type StatusFilter = ActiveStatusFilterValue;

export default function MotivosIncidenciaPage() {
  const list = useListFilters<{ status: StatusFilter }>({ status: "all" });
  const { search, debouncedSearch, page, setPage, clearFilters, hasFilters } = list;
  const statusFilter = list.filters.status;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState<MotivoIncidencia>();
  const [pendingDeactivate, setPendingDeactivate] = useState<MotivoIncidencia>();
  const [actionError, setActionError] = useState("");
  const [listActionError, setListActionError] = useState("");

  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [page, debouncedSearch, statusFilter]);
  const motivos = useMotivosIncidencia(params);
  const totalPages = Math.max(motivos.pages ?? 0, 1);

  const openCreate = () => {
    setEditingMotivo(undefined);
    setDialogOpen(true);
  };

  const openEdit = (motivo: MotivoIncidencia) => {
    setEditingMotivo(motivo);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    if (motivos.isSaving) return;
    setDialogOpen(open);
    if (!open) setEditingMotivo(undefined);
  };

  const saveMotivo: ComponentProps<typeof MotivoIncidenciaForm>["onSubmit"] = async (values) => {
    await motivos.saveItem(values, editingMotivo?.id);
    setDialogOpen(false);
    setEditingMotivo(undefined);
    if (!editingMotivo) setPage(1);
  };

  // Desactivar pide confirmación (deja de ofrecerse en la app); activar es inmediato.
  const requestToggle = async (motivo: MotivoIncidencia) => {
    setListActionError("");
    if (motivo.active) {
      setActionError("");
      setPendingDeactivate(motivo);
      return;
    }

    try {
      await motivos.toggleActive(motivo);
    } catch (error) {
      const apiError = parseApiError(error);
      setListActionError(apiError.status === 404
        ? "Este motivo ya no existe. Actualiza la lista."
        : apiError.message);
    }
  };

  const confirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    setActionError("");

    try {
      await motivos.toggleActive(pendingDeactivate);
      setPendingDeactivate(undefined);
    } catch (error) {
      const apiError = parseApiError(error);
      setActionError(apiError.status === 404
        ? "Este motivo ya no existe. Actualiza la lista."
        : apiError.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos"
        title="Motivos de incidencia"
        icon={ListX}
        description="Define las causas que el repartidor puede reportar y si cada una exige foto de evidencia."
        action={<Button onClick={openCreate}><Plus aria-hidden /> Nuevo motivo</Button>}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Catálogo de motivos de incidencia">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ListFilter className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Catálogo operativo</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {motivos.total} {motivos.total === 1 ? "motivo encontrado" : "motivos encontrados"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <SearchField id="motivos-incidencia-search" label="Buscar motivos de incidencia"
              value={search} onChange={list.setSearch}
              placeholder="Cliente ausente o INC-CLI" maxLength={100} className="sm:min-w-64 lg:w-72" />
            <ActiveStatusFilter value={statusFilter}
              onChange={(value) => list.setFilter("status", value)} />
          </div>
        </div>

        {motivos.isError ? (
          <ErrorAlert error={motivos.error} onRetry={() => motivos.refetch()} className="mt-4" />
        ) : (
          <div className="mt-4" aria-busy={motivos.isFetching}>
            {motivos.isFetching && !motivos.isLoading && (
              <p className="mb-3 text-sm text-muted-foreground" role="status">Actualizando motivos…</p>
            )}
            {listActionError && (
              <Alert variant="destructive" className="mb-4">
                <TriangleAlert aria-hidden />
                <AlertDescription>{listActionError}</AlertDescription>
              </Alert>
            )}
            <MotivosIncidenciaTable
              data={motivos.data}
              loading={motivos.isLoading}
              searchActive={hasFilters}
              busy={motivos.isSaving}
              onEdit={openEdit}
              onToggle={requestToggle}
            />
          </div>
        )}

        {hasFilters && !motivos.isLoading && !motivos.isError && motivos.total === 0 && (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}

        {!motivos.isError && !motivos.isLoading && motivos.total > 0 && (
          <PaginationControls page={page} totalPages={totalPages} reportedPage={motivos.page}
            total={motivos.total} busy={motivos.isFetching} onPageChange={setPage} />
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMotivo ? "Editar motivo de incidencia" : "Nuevo motivo de incidencia"}</DialogTitle>
            <DialogDescription>
              {editingMotivo
                ? "Actualiza el motivo, su requisito de foto y su disponibilidad."
                : "El motivo quedará activo y disponible para los repartidores al guardarlo."}
            </DialogDescription>
          </DialogHeader>
          <MotivoIncidenciaForm
            key={editingMotivo?.id ?? "new"}
            motivo={editingMotivo}
            onSubmit={saveMotivo}
            onCancel={() => closeDialog(false)}
            guardando={motivos.isSaving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog open={!!pendingDeactivate}
        onOpenChange={(open) => { if (!open) { setPendingDeactivate(undefined); setActionError(""); } }}
        title="Desactivar motivo de incidencia"
        description={`El motivo ${pendingDeactivate?.name ?? ""} dejará de ofrecerse a los repartidores. Las incidencias ya registradas y su evidencia no cambian.`}
        confirmLabel="Desactivar motivo" busy={motivos.isSaving} error={actionError}
        onConfirm={confirmDeactivate} />
    </div>
  );
}
