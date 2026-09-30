import { useMemo } from "react";
import { Plus, Truck } from "lucide-react";

import {
  VehiculosTable,
  VehiculoForm,
  useVehiculos,
  type Vehiculo,
  type VehiculoFormValues,
} from "@/domains/flota";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { SearchField } from "@/shared/components/common/search-field";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { useEditorDialog } from "@/shared/hooks/use-editor-dialog";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const PAGE_SIZE = 10;

export default function FlotaPage() {
  const { search, debouncedSearch, page, setPage, setSearch, hasFilters } = useListFilters({});
  const editor = useEditorDialog<Vehiculo>();
  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  }), [debouncedSearch, page]);
  const flota = useVehiculos(params);
  const totalPages = flota.pages ?? 1;

  const saveVehiculo = async (values: VehiculoFormValues) => {
    if (editor.editingItem) {
      await flota.updateItem({ id: editor.editingItem.id, data: values });
    } else {
      await flota.createItem(values);
    }
    editor.onOpenChange(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flota"
        title="Vehículos"
        icon={Truck}
        description="Gestiona los vehículos disponibles y su capacidad de carga."
        action={(
          <Button onClick={editor.openCreate}>
            <Plus aria-hidden /> Nuevo vehículo
          </Button>
        )}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Catálogo de vehículos">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-brand-turquoise" aria-hidden />
              <h2 className="font-semibold">Flota registrada</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {flota.total} {flota.total === 1 ? "vehículo registrado" : "vehículos registrados"}
            </p>
          </div>
          <SearchField
            id="vehiculos-search"
            label="Buscar por placa, modelo o tipo"
            value={search}
            onChange={setSearch}
            placeholder="Placa, modelo o tipo"
            className="md:max-w-sm"
          />
        </div>

        {flota.isError ? (
          <ErrorAlert error={flota.error} onRetry={() => flota.refetch()} className="mt-4" />
        ) : (
          <div className="mt-4">
            <VehiculosTable
              data={flota.data}
              loading={flota.isLoading}
              searchActive={hasFilters}
              onEdit={editor.openEdit}
            />
          </div>
        )}

        {!flota.isError && !flota.isLoading && flota.total > 0 && (
          <PaginationControls page={page} totalPages={totalPages} reportedPage={flota.page}
            onPageChange={setPage} busy={flota.isFetching} />
        )}
      </section>

      <Dialog open={editor.open} onOpenChange={editor.onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editor.editingItem ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
            <DialogDescription>
              {editor.editingItem
                ? "Actualiza los datos del vehículo."
                : "Registra un vehículo para incluirlo en la flota."}
            </DialogDescription>
          </DialogHeader>
          <VehiculoForm
            key={editor.editingItem?.id ?? "new"}
            vehiculo={editor.editingItem}
            onSubmit={saveVehiculo}
            onCancel={() => editor.onOpenChange(false)}
            guardando={flota.isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
