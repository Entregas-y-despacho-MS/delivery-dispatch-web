import { useDeferredValue, useMemo, useState } from "react";
import { MapPin, Plus, Timer } from "lucide-react";

import {
  ZonaForm,
  ZonasSearch,
  ZonasTable,
  useZonas,
  type Zona,
  type ZonaFormValues,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const PAGE_SIZE = 10;

export default function ZonasPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZona, setEditingZona] = useState<Zona>();
  const [zonaToDeactivate, setZonaToDeactivate] = useState<Zona>();
  const deferredSearch = useDeferredValue(search);
  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
  }), [deferredSearch, page]);
  const zonas = useZonas(params);
  const hasSearch = deferredSearch.trim().length > 0;
  const totalPages = zonas.pages ?? 1;

  const openCreate = () => {
    setEditingZona(undefined);
    setDialogOpen(true);
  };

  const openEdit = (zona: Zona) => {
    setEditingZona(zona);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingZona(undefined);
  };

  const saveZona = async (values: ZonaFormValues) => {
    if (editingZona) {
      await zonas.updateItem({ id: editingZona.id, data: values });
    } else {
      await zonas.createItem(values);
    }
    closeDialog(false);
  };

  // La API actual solo expone eliminación lógica; la reactivación requerirá un endpoint adicional.
  const deactivateZona = async () => {
    if (!zonaToDeactivate) return;
    await zonas.deleteItem(zonaToDeactivate.id);
    setZonaToDeactivate(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos"
        title="Zonas de reparto"
        icon={MapPin}
        description="Define el tiempo base que utiliza el equipo para planificar las entregas."
        action={(
          <Button onClick={openCreate}>
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
          <ZonasSearch
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
          />
        </div>

        {zonas.isError ? (
          <ErrorAlert
            error={zonas.error}
            onRetry={() => zonas.refetch()}
            autoRetry={5}
            className="mt-4"
          />
        ) : (
          <div className="mt-4">
            <ZonasTable
              data={zonas.data}
              loading={zonas.isLoading}
              searchActive={hasSearch}
              onClearFilters={() => { setSearch(""); setPage(1); }}
              deactivating={zonas.deleteMutation.isPending}
              onEdit={openEdit}
              onDeactivate={setZonaToDeactivate}
            />
          </div>
        )}

        {!zonas.isError && !zonas.isLoading && zonas.total > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Página <span className="font-medium text-foreground">{zonas.page ?? page}</span> de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || zonas.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || zonas.isFetching}
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
            <DialogTitle>{editingZona ? "Editar zona" : "Nueva zona"}</DialogTitle>
            <DialogDescription>
              {editingZona
                ? "Actualiza el código, nombre o tiempo base de la zona."
                : "Registra una zona para incluirla en la planificación de entregas."}
            </DialogDescription>
          </DialogHeader>
          <ZonaForm
            key={editingZona?.id ?? "new"}
            zona={editingZona}
            onSubmit={saveZona}
            onCancel={() => closeDialog(false)}
            guardando={zonas.isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!zonaToDeactivate} onOpenChange={(open) => { if (!open) setZonaToDeactivate(undefined); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar zona</DialogTitle>
            <DialogDescription>
              {zonaToDeactivate
                ? `La zona ${zonaToDeactivate.code} dejará de aparecer en el catálogo y no podrá asignarse a nuevas entregas.`
                : "La zona dejará de estar disponible para nuevas entregas."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setZonaToDeactivate(undefined)} disabled={zonas.deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={deactivateZona} disabled={zonas.deleteMutation.isPending}>
              {zonas.deleteMutation.isPending ? "Desactivando…" : "Desactivar zona"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
