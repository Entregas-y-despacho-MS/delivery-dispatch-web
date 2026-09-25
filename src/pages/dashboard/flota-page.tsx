import { useDeferredValue, useMemo, useState } from "react";
import { Plus, RotateCw, Truck } from "lucide-react";

import {
  FlotaSearch,
  FlotaTable,
  VehiculoForm,
  useFlota,
  type Vehiculo,
  type VehiculoFormValues,
} from "@/domains/flota";
import { PageHeader } from "@/shared/components/common/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const PAGE_SIZE = 10;

export default function FlotaPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo>();
  const deferredSearch = useDeferredValue(search);
  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
  }), [deferredSearch, page]);
  const flota = useFlota(params);
  const hasSearch = deferredSearch.trim().length > 0;
  const totalPages = flota.pages ?? 1;

  const openCreate = () => {
    setEditingVehiculo(undefined);
    setDialogOpen(true);
  };

  const openEdit = (vehiculo: Vehiculo) => {
    setEditingVehiculo(vehiculo);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingVehiculo(undefined);
  };

  const saveVehiculo = async (values: VehiculoFormValues) => {
    if (editingVehiculo) {
      await flota.updateItem({ id: editingVehiculo.id, data: values });
    } else {
      await flota.createItem(values);
    }
    closeDialog(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flota"
        title="Vehículos"
        icon={Truck}
        description="Gestiona los vehículos disponibles y su capacidad de carga."
        action={(
          <Button onClick={openCreate}>
            <Plus aria-hidden /> Nuevo vehículo
          </Button>
        )}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Catálogo de vehículos">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Flota registrada</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {flota.total} {flota.total === 1 ? "vehículo registrado" : "vehículos registrados"}
            </p>
          </div>
          <FlotaSearch
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
          />
        </div>

        {flota.isError ? (
          <Alert variant="destructive" className="mt-4">
            <RotateCw aria-hidden />
            <AlertTitle>No pudimos cargar la flota</AlertTitle>
            <AlertDescription>
              Revisa tu conexión y vuelve a intentarlo.
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => flota.refetch()}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="mt-4">
            <FlotaTable
              data={flota.data}
              loading={flota.isLoading}
              searchActive={hasSearch}
              onEdit={openEdit}
            />
          </div>
        )}

        {!flota.isError && !flota.isLoading && flota.total > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Página <span className="font-medium text-foreground">{flota.page ?? page}</span> de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || flota.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || flota.isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVehiculo ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
            <DialogDescription>
              {editingVehiculo
                ? "Actualiza los datos del vehículo."
                : "Registra un vehículo para incluirlo en la flota."}
            </DialogDescription>
          </DialogHeader>
          <VehiculoForm
            key={editingVehiculo?.id ?? "new"}
            vehiculo={editingVehiculo}
            onSubmit={saveVehiculo}
            onCancel={() => closeDialog(false)}
            guardando={flota.isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
