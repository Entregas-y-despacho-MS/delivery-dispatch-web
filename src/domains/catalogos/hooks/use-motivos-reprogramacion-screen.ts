import { useMemo, useState } from "react";

import { useListFilters } from "@/shared/hooks/use-list-filters";
import { parseApiError } from "@/shared/lib/api-error";
import type { MotivoReprogramacionFormValues } from "../catalogos.schemas";
import type { MotivoReprogramacion, MotivoReprogramacionCategoria } from "../catalogos.types";
import { useMotivosReprogramacion } from "./use-motivos-reprogramacion";

const PAGE_SIZE = 10;
export type StatusFilter = "all" | "active" | "inactive";
export type CategoryFilter = "all" | MotivoReprogramacionCategoria;

export function useMotivosReprogramacionScreen() {
  const list = useListFilters<{ status: StatusFilter; category: CategoryFilter }>({
    status: "all",
    category: "all",
  });
  const { search, debouncedSearch, page, setPage, clearFilters, hasFilters } = list;
  const statusFilter = list.filters.status;
  const categoryFilter = list.filters.category;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState<MotivoReprogramacion>();
  const [pendingDeactivate, setPendingDeactivate] = useState<MotivoReprogramacion>();
  const [actionError, setActionError] = useState("");
  const [listActionError, setListActionError] = useState("");
  const [formDirty, setFormDirty] = useState(false);

  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [page, debouncedSearch, categoryFilter, statusFilter]);
  const motivos = useMotivosReprogramacion(params);
  const totalPages = Math.max(motivos.pages ?? 0, 1);

  const openCreate = () => {
    setEditingMotivo(undefined);
    setFormDirty(false);
    setDialogOpen(true);
  };

  const openEdit = (motivo: MotivoReprogramacion) => {
    setEditingMotivo(motivo);
    setFormDirty(false);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    if (motivos.isSaving) return;
    if (!open && formDirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
    setDialogOpen(open);
    if (!open) setEditingMotivo(undefined);
  };

  const saveMotivo = async (values: MotivoReprogramacionFormValues) => {
    await motivos.saveItem(values, editingMotivo?.id);
    setDialogOpen(false);
    setEditingMotivo(undefined);
    setFormDirty(false);
    if (!editingMotivo) setPage(1);
  };

  const requestToggle = async (motivo: MotivoReprogramacion) => {
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

  return {
    motivos,
    search,
    setSearch: list.setSearch,
    statusFilter,
    setStatusFilter: (value: StatusFilter) => list.setFilter("status", value),
    categoryFilter,
    setCategoryFilter: (value: CategoryFilter) => list.setFilter("category", value),
    page,
    setPage,
    hasFilters,
    totalPages,
    dialogOpen,
    editingMotivo,
    setFormDirty,
    openCreate,
    openEdit,
    closeDialog,
    saveMotivo,
    pendingDeactivate,
    setPendingDeactivate,
    actionError,
    setActionError,
    listActionError,
    requestToggle,
    confirmDeactivate,
    clearFilters,
  };
}
