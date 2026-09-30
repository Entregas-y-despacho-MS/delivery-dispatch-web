import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Gauge, ListFilter, Plus, Search, TriangleAlert } from "lucide-react";

import {
  NivelServicioForm,
  NivelesServicioTable,
  useNivelesServicio,
  type NivelServicio,
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
type PendingAction = { kind: "deactivate" | "delete"; nivel: NivelServicio };

export default function NivelesServicioPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNivel, setEditingNivel] = useState<NivelServicio>();
  const [pendingAction, setPendingAction] = useState<PendingAction>();
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
  const niveles = useNivelesServicio(params);
  const hasFilters = !!debouncedSearch || statusFilter !== "all";
  const totalPages = Math.max(niveles.pages ?? 0, 1);

  const openCreate = () => {
    setEditingNivel(undefined);
    setDialogOpen(true);
  };

  const openEdit = (nivel: NivelServicio) => {
    setEditingNivel(nivel);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    if (niveles.isSaving) return;
    setDialogOpen(open);
    if (!open) setEditingNivel(undefined);
  };

  const saveNivel: ComponentProps<typeof NivelServicioForm>["onSubmit"] = async (values) => {
    await niveles.saveItem(values, editingNivel?.id);
    setDialogOpen(false);
    setEditingNivel(undefined);
    if (!editingNivel) setPage(1);
  };

  const requestToggle = async (nivel: NivelServicio) => {
    setListActionError("");
    if (nivel.active) {
      setActionError("");
      setPendingAction({ kind: "deactivate", nivel });
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
    if (!pendingAction) return;
    setActionError("");

    try {
      if (pendingAction.kind === "deactivate") {
        await niveles.toggleActive(pendingAction.nivel);
      } else {
        await niveles.removeItem(pendingAction.nivel.id);
        if (page > 1 && niveles.data.length === 1) setPage(page - 1);
      }
      setPendingAction(undefined);
    } catch (error) {
      const apiError = parseApiError(error);
      setActionError(apiError.code === "SERVICE_LEVEL_IN_USE"
          ? "Este nivel tiene despachos en curso. Desactívalo para impedir nuevas asignaciones."
        : apiError.status === 404
          ? "Este nivel ya no existe. Actualiza la lista."
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
        title="Niveles de servicio"
        icon={Gauge}
        description="Define los compromisos de entrega que orientan la prioridad de cada despacho."
        action={<Button onClick={openCreate}><Plus aria-hidden /> Nuevo nivel</Button>}
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
            <div className="relative w-full sm:min-w-64 lg:w-72">
              <label htmlFor="niveles-servicio-search" className="sr-only">Buscar niveles de servicio</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="niveles-servicio-search"
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Express o entrega prioritaria"
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
              onEdit={openEdit}
              onToggle={requestToggle}
              onDelete={(nivel) => { setActionError(""); setPendingAction({ kind: "delete", nivel }); }}
            />
          </div>
        )}

        {hasFilters && !niveles.isLoading && !niveles.isError && niveles.total === 0 && (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}

        {!niveles.isError && !niveles.isLoading && niveles.total > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Página <span className="font-medium text-foreground">{niveles.page ?? page}</span> de {totalPages}
              <span className="ml-2">· {niveles.total} en total</span>
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1 || niveles.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages || niveles.isFetching} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Siguiente</Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
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
            onCancel={() => closeDialog(false)}
            guardando={niveles.isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingAction} onOpenChange={(open) => { if (!open && !niveles.isSaving) { setPendingAction(undefined); setActionError(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingAction?.kind === "delete" ? "Eliminar nivel de servicio" : "Desactivar nivel de servicio"}</DialogTitle>
            <DialogDescription>
              {pendingAction?.kind === "delete"
                ? `El nivel ${pendingAction.nivel.name} dejará de estar disponible. Los despachos finalizados conservarán su referencia.`
                : `El nivel ${pendingAction?.nivel.name ?? ""} no estará disponible para nuevas órdenes. Los despachos actuales no cambiarán.`}
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={niveles.isSaving} onClick={() => { setPendingAction(undefined); setActionError(""); }}>Cancelar</Button>
            <Button type="button" variant="destructive" disabled={niveles.isSaving} onClick={confirmAction}>
              {niveles.isSaving ? "Procesando…" : pendingAction?.kind === "delete" ? "Eliminar nivel" : "Desactivar nivel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
