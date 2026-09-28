import { useEffect, useMemo, useState } from "react";

import { parseApiError } from "@/shared/lib/api-error";
import type { MotivoReprogramacionFormValues } from "../catalogos.schemas";
import type { MotivoReprogramacion, MotivoReprogramacionCategoria } from "../catalogos.types";
import { useMotivosReprogramacion } from "./use-motivos-reprogramacion";

const PAGE_SIZE = 10;
export type StatusFilter = "all" | "active" | "inactive";
export type CategoryFilter = "all" | MotivoReprogramacionCategoria;

export function useMotivosReprogramacionScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState<MotivoReprogramacion>();
  const [pendingDeactivate, setPendingDeactivate] = useState<MotivoReprogramacion>();
  const [actionError, setActionError] = useState("");
  const [listActionError, setListActionError] = useState("");
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [page, debouncedSearch, categoryFilter, statusFilter]);
  const motivos = useMotivosReprogramacion(params);
  const hasFilters = !!search || categoryFilter !== "all" || statusFilter !== "all";
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
      setListActionError(parseApiError(error).status === 404
        ? "Este motivo ya no existe. Actualiza la lista."
        : "No pudimos activar el motivo. Revisa tu conexión e inténtalo de nuevo.");
    }
  };

  const confirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    setActionError("");
    try {
      await motivos.toggleActive(pendingDeactivate);
      setPendingDeactivate(undefined);
    } catch (error) {
      setActionError(parseApiError(error).status === 404
        ? "Este motivo ya no existe. Actualiza la lista."
        : "No pudimos desactivar el motivo. Revisa tu conexión e inténtalo de nuevo.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  return {
    motivos,
    search,
    setSearch: (value: string) => { setSearch(value); setPage(1); },
    statusFilter,
    setStatusFilter: (value: StatusFilter) => { setStatusFilter(value); setPage(1); },
    categoryFilter,
    setCategoryFilter: (value: CategoryFilter) => { setCategoryFilter(value); setPage(1); },
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
