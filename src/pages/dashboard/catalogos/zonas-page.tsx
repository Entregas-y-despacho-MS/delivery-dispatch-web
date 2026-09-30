import { useMemo, type ComponentProps } from "react";
import { MapPin, Plus, Timer } from "lucide-react";

import {
  ZonaForm,
  ZonasTable,
  useZonas,
  type Zona,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { ConfirmActionDialog } from "@/shared/components/common/confirm-action-dialog";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { SearchField } from "@/shared/components/common/search-field";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { useEditorDialog } from "@/shared/hooks/use-editor-dialog";
import { useConfirmAction } from "@/shared/hooks/use-confirm-action";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import { parseApiError } from "@/shared/lib/api-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const PAGE_SIZE = 10;

export default function ZonasPage() {
  const { search, debouncedSearch, page, setPage, setSearch, clearFilters, hasFilters } = useListFilters({});
  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  }), [debouncedSearch, page]);
  const zonas = useZonas(params);
  const totalPages = zonas.pages ?? 1;
  const editor = useEditorDialog<Zona>({
    busy: zonas.isSaving,
    confirmDiscardMessage: "¿Descartar los cambios sin guardar?",
  });
  const confirmation = useConfirmAction<Zona>();

  const saveZona: ComponentProps<typeof ZonaForm>["onSubmit"] = async (values) => {
    if (editor.editingItem) {
      await zonas.updateItem({ id: editor.editingItem.id, data: values });
    } else {
      await zonas.createItem(values);
    }
    editor.finish();
  };

  // La API actual solo expone eliminación lógica; la reactivación requerirá un endpoint adicional.
  const deactivateZona = async () => {
    const zonaToDeactivate = confirmation.item;
    if (!zonaToDeactivate) return;
    confirmation.setError("");
    try {
      await zonas.deleteItem(zonaToDeactivate.id);
      confirmation.close();
    } catch (error) {
      confirmation.setError(parseApiError(error).message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos"
        title="Zonas de reparto"
        icon={MapPin}
        description="Define el tiempo base que utiliza el equipo para planificar las entregas."
        action={(
          <Button onClick={editor.openCreate}>
            <Plus aria-hidden /> Nueva zona
          </Button>
        )}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Catálogo de zonas">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Catálogo operativo</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {zonas.total} {zonas.total === 1 ? "zona registrada" : "zonas registradas"}
            </p>
          </div>
          <SearchField
            id="zonas-search"
            label="Buscar por código o nombre"
            value={search}
            onChange={setSearch}
            placeholder="ZON-SUR o Zona Sur"
            className="md:max-w-sm"
          />
        </div>

        {zonas.isError ? (
          <ErrorAlert
            error={zonas.error}
            onRetry={() => zonas.refetch()}
            className="mt-4"
          />
        ) : (
          <div className="mt-4">
            <ZonasTable
              data={zonas.data}
              loading={zonas.isLoading}
              searchActive={hasFilters}
              onClearFilters={clearFilters}
              deactivating={zonas.deleteMutation.isPending}
              onEdit={editor.openEdit}
              onDeactivate={confirmation.request}
            />
          </div>
        )}

        {!zonas.isError && !zonas.isLoading && zonas.total > 0 && (
          <PaginationControls page={page} totalPages={totalPages} reportedPage={zonas.page}
            onPageChange={setPage} busy={zonas.isFetching} />
        )}
      </section>

      <Dialog open={editor.open} onOpenChange={editor.onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editor.editingItem ? "Editar zona" : "Nueva zona"}</DialogTitle>
            <DialogDescription>
              {editor.editingItem
                ? "Actualiza el código, nombre o tiempo base de la zona."
                : "Registra una zona para incluirla en la planificación de entregas."}
            </DialogDescription>
          </DialogHeader>
          <ZonaForm
            key={editor.editingItem?.id ?? "new"}
            zona={editor.editingItem}
            onSubmit={saveZona}
            onCancel={() => editor.onOpenChange(false)}
            onDirtyChange={editor.setDirty}
            guardando={zonas.isSaving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog open={!!confirmation.item}
        onOpenChange={confirmation.onOpenChange}
        title="Desactivar zona"
        description={confirmation.item
          ? `La zona ${confirmation.item.code} dejará de aparecer en el catálogo y no podrá asignarse a nuevas entregas.`
          : "La zona dejará de estar disponible para nuevas entregas."}
        confirmLabel="Desactivar zona" busyLabel="Desactivando…"
        busy={zonas.deleteMutation.isPending} error={confirmation.error} onConfirm={deactivateZona} />
    </div>
  );
}
