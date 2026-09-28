import { ListFilter, Plus, RotateCw, Search, TriangleAlert } from "lucide-react";

import {
  MOTIVO_REPROGRAMACION_CATEGORIAS,
  MotivoReprogramacionForm,
  MotivosReprogramacionTable,
  useMotivosReprogramacionScreen,
  type CategoryFilter,
  type StatusFilter,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
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
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ListFilter className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Causales operativas</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {motivos.isLoading ? "Cargando motivos…" : `${motivos.total} ${motivos.total === 1 ? "motivo encontrado" : "motivos encontrados"}`}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto">
            <div className="relative w-full sm:min-w-56 sm:flex-1 lg:w-64 lg:flex-none">
              <label htmlFor="reprogramacion-search" className="sr-only">Buscar motivos</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="reprogramacion-search" type="search" value={screen.search}
                onChange={(event) => screen.setSearch(event.target.value)}
                placeholder="Solicitud del cliente" maxLength={100} className="h-10 pl-10" />
            </div>
            <Select value={screen.categoryFilter} onValueChange={(value: CategoryFilter) => screen.setCategoryFilter(value)}>
              <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrar por origen"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                {MOTIVO_REPROGRAMACION_CATEGORIAS.map((origin) => (
                  <SelectItem key={origin.value} value={origin.value}>{origin.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={screen.statusFilter} onValueChange={(value: StatusFilter) => screen.setStatusFilter(value)}>
              <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {motivos.isError ? (
          <Alert variant="destructive" className="mt-4">
            <RotateCw aria-hidden />
            <AlertTitle>No pudimos cargar los motivos</AlertTitle>
            <AlertDescription>
              Vuelve a intentarlo. Si el problema continúa, verifica que el catálogo esté disponible.
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => motivos.refetch()}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
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
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Página <span className="font-medium text-foreground">{motivos.page ?? screen.page}</span> de {screen.totalPages}
              <span className="ml-2">· {motivos.total} en total</span></p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={screen.page <= 1 || motivos.isFetching}
                onClick={() => screen.setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
              <Button type="button" variant="outline" size="sm" disabled={screen.page >= screen.totalPages || motivos.isFetching}
                onClick={() => screen.setPage((current) => Math.min(screen.totalPages, current + 1))}>Siguiente</Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={screen.dialogOpen} onOpenChange={screen.closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{screen.editingMotivo ? "Editar motivo" : "Nuevo motivo"}</DialogTitle>
            <DialogDescription>
              {screen.editingMotivo
                ? "Actualiza los datos del motivo y su categoría."
                : "El motivo quedará activo y disponible para justificar cambios operativos."}
            </DialogDescription>
          </DialogHeader>
          <MotivoReprogramacionForm key={screen.editingMotivo?.id ?? "new"}
            motivo={screen.editingMotivo} onSubmit={screen.saveMotivo}
            onCancel={() => screen.closeDialog(false)} onDirtyChange={screen.setFormDirty}
            guardando={motivos.isSaving} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!screen.pendingDeactivate} onOpenChange={(open) => {
        if (!open && !motivos.isSaving) { screen.setPendingDeactivate(undefined); screen.setActionError(""); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar motivo</DialogTitle>
            <DialogDescription>
              {`El motivo ${screen.pendingDeactivate?.name ?? ""} ya no estará disponible para nuevos cambios. Los registros anteriores se conservarán.`}
            </DialogDescription>
          </DialogHeader>
          {screen.actionError && (
            <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription>{screen.actionError}</AlertDescription></Alert>
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={motivos.isSaving}
              onClick={() => { screen.setPendingDeactivate(undefined); screen.setActionError(""); }}>Cancelar</Button>
            <Button type="button" variant="destructive" disabled={motivos.isSaving} onClick={screen.confirmDeactivate}>
              {motivos.isSaving ? "Procesando…" : "Desactivar motivo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
