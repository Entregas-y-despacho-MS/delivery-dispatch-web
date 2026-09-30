import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { ListFilter, ListX, Plus, Search, TriangleAlert } from "lucide-react";

import {
  MotivoIncidenciaForm,
  MotivosIncidenciaTable,
  useMotivosIncidencia,
  type MotivoIncidencia,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
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
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { parseApiError } from "@/shared/lib/api-error";

const PAGE_SIZE = 10;
type StatusFilter = "all" | "active" | "inactive";

export default function MotivosIncidenciaPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState<MotivoIncidencia>();
  const [pendingDeactivate, setPendingDeactivate] = useState<MotivoIncidencia>();
  const [actionError, setActionError] = useState("");
  const [listActionError, setListActionError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [page, debouncedSearch, statusFilter]);
  const motivos = useMotivosIncidencia(params);
  const hasFilters = !!debouncedSearch || statusFilter !== "all";
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

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setPage(1);
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
            <div className="relative w-full sm:min-w-64 lg:w-72">
              <label htmlFor="motivos-incidencia-search" className="sr-only">Buscar motivos de incidencia</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="motivos-incidencia-search"
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Cliente ausente o INC-CLI"
                maxLength={100}
                className="h-10 pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => { setStatusFilter(value); setPage(1); }}>
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
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Página <span className="font-medium text-foreground">{motivos.page ?? page}</span> de {totalPages}
              <span className="ml-2">· {motivos.total} en total</span>
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1 || motivos.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages || motivos.isFetching} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Siguiente</Button>
            </div>
          </div>
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

      <Dialog open={!!pendingDeactivate} onOpenChange={(open) => { if (!open && !motivos.isSaving) { setPendingDeactivate(undefined); setActionError(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar motivo de incidencia</DialogTitle>
            <DialogDescription>
              {`El motivo ${pendingDeactivate?.name ?? ""} dejará de ofrecerse a los repartidores. Las incidencias ya registradas y su evidencia no cambian.`}
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={motivos.isSaving} onClick={() => { setPendingDeactivate(undefined); setActionError(""); }}>Cancelar</Button>
            <Button type="button" variant="destructive" disabled={motivos.isSaving} onClick={confirmDeactivate}>
              {motivos.isSaving ? "Procesando…" : "Desactivar motivo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
