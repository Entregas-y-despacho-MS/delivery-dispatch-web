import { useMemo, useState, type ComponentProps } from "react";
import { Gauge, ListFilter, Plus, TriangleAlert } from "lucide-react";

import {
  NivelServicioForm,
  NivelesServicioTable,
  useNivelesServicio,
  type NivelServicio,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { ConfirmActionDialog } from "@/shared/components/common/confirm-action-dialog";
import { ActiveStatusFilter, type ActiveStatusFilterValue } from "@/shared/components/common/active-status-filter";
import { SearchField } from "@/shared/components/common/search-field";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import { useEditorDialog } from "@/shared/hooks/use-editor-dialog";
import { useConfirmAction } from "@/shared/hooks/use-confirm-action";
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
type PendingAction = { kind: "deactivate" | "delete"; nivel: NivelServicio };

export default function NivelesServicioPage() {
  const list = useListFilters<{ status: StatusFilter }>({ status: "all" });
  const { search, debouncedSearch, page, setPage, clearFilters, hasFilters } = list;
  const statusFilter = list.filters.status;
  const [listActionError, setListActionError] = useState("");

  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [page, debouncedSearch, statusFilter]);
  const niveles = useNivelesServicio(params);
  const totalPages = Math.max(niveles.pages ?? 0, 1);
  const editor = useEditorDialog<NivelServicio>({
    busy: niveles.isSaving,
    confirmDiscardMessage: "¿Descartar los cambios sin guardar?",
  });
  const confirmation = useConfirmAction<PendingAction>();
  const editingNivel = editor.editingItem;

  const saveNivel: ComponentProps<typeof NivelServicioForm>["onSubmit"] = async (values) => {
    await niveles.saveItem(values, editingNivel?.id);
    editor.finish();
    if (!editingNivel) setPage(1);
  };

  const requestToggle = async (nivel: NivelServicio) => {
    setListActionError("");
    if (nivel.active) {
      confirmation.request({ kind: "deactivate", nivel });
      return;
    }

    try {
      await niveles.toggleActive(nivel);
    } catch (error) {
      const apiError = parseApiError(error);
      setListActionError(apiError.status === 404
        ? "Este nivel ya no existe. Actualiza la lista."
        : apiError.message);
    }
  };

  const confirmAction = async () => {
    const pendingAction = confirmation.item;
    if (!pendingAction) return;
    confirmation.setError("");

    try {
      if (pendingAction.kind === "deactivate") {
        await niveles.toggleActive(pendingAction.nivel);
      } else {
        await niveles.removeItem(pendingAction.nivel.id);
        if (page > 1 && niveles.data.length === 1) setPage(page - 1);
      }
      confirmation.close();
    } catch (error) {
      const apiError = parseApiError(error);
      confirmation.setError(apiError.code === "SERVICE_LEVEL_IN_USE"
          ? "Este nivel tiene despachos en curso. Desactívalo para impedir nuevas asignaciones."
        : apiError.status === 404
          ? "Este nivel ya no existe. Actualiza la lista."
          : apiError.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos"
        title="Niveles de servicio"
        icon={Gauge}
        description="Define los compromisos de entrega que orientan la prioridad de cada despacho."
        action={<Button onClick={editor.openCreate}><Plus aria-hidden /> Nuevo nivel</Button>}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Catálogo de niveles de servicio">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ListFilter className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Catálogo operativo</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {niveles.total} {niveles.total === 1 ? "nivel encontrado" : "niveles encontrados"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <SearchField id="niveles-servicio-search" label="Buscar niveles de servicio"
              value={search} onChange={list.setSearch}
              placeholder="Express o entrega prioritaria" maxLength={100} className="sm:min-w-64 lg:w-72" />
            <ActiveStatusFilter value={statusFilter}
              onChange={(value) => list.setFilter("status", value)} />
          </div>
        </div>

        {niveles.isError ? (
          <ErrorAlert error={niveles.error} onRetry={() => niveles.refetch()} className="mt-4" />
        ) : (
          <div className="mt-4" aria-busy={niveles.isFetching}>
            {niveles.isFetching && !niveles.isLoading && (
              <p className="mb-3 text-sm text-muted-foreground" role="status">Actualizando niveles…</p>
            )}
            {listActionError && (
              <Alert variant="destructive" className="mb-4">
                <TriangleAlert aria-hidden />
                <AlertDescription>{listActionError}</AlertDescription>
              </Alert>
            )}
            <NivelesServicioTable
              data={niveles.data}
              loading={niveles.isLoading}
              searchActive={hasFilters}
              busy={niveles.isSaving}
              onEdit={editor.openEdit}
              onToggle={requestToggle}
              onDelete={(nivel) => confirmation.request({ kind: "delete", nivel })}
            />
          </div>
        )}

        {hasFilters && !niveles.isLoading && !niveles.isError && niveles.total === 0 && (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}

        {!niveles.isError && !niveles.isLoading && niveles.total > 0 && (
          <PaginationControls page={page} totalPages={totalPages} reportedPage={niveles.page}
            total={niveles.total} busy={niveles.isFetching} onPageChange={setPage} />
        )}
      </section>

      <Dialog open={editor.open} onOpenChange={editor.onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNivel ? "Editar nivel de servicio" : "Nuevo nivel de servicio"}</DialogTitle>
            <DialogDescription>
              {editingNivel
                ? "Actualiza el compromiso de entrega y la prioridad operativa."
                : "Configura un compromiso de entrega para asociarlo a las órdenes."}
            </DialogDescription>
          </DialogHeader>
          <NivelServicioForm
            key={editingNivel?.id ?? "new"}
            nivel={editingNivel}
            onSubmit={saveNivel}
            onCancel={() => editor.onOpenChange(false)}
            onDirtyChange={editor.setDirty}
            guardando={niveles.isSaving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog open={!!confirmation.item}
        onOpenChange={confirmation.onOpenChange}
        title={confirmation.item?.kind === "delete" ? "Eliminar nivel de servicio" : "Desactivar nivel de servicio"}
        description={confirmation.item?.kind === "delete"
          ? `El nivel ${confirmation.item.nivel.name} dejará de estar disponible. Los despachos finalizados conservarán su referencia.`
          : `El nivel ${confirmation.item?.nivel.name ?? ""} no estará disponible para nuevas órdenes. Los despachos actuales no cambiarán.`}
        confirmLabel={confirmation.item?.kind === "delete" ? "Eliminar nivel" : "Desactivar nivel"}
        busy={niveles.isSaving} error={confirmation.error} onConfirm={confirmAction} />
    </div>
  );
}
