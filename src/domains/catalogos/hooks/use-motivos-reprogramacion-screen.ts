import { useMemo, useState } from "react";

import { useListFilters } from "@/shared/hooks/use-list-filters";
import { useEditorDialog } from "@/shared/hooks/use-editor-dialog";
import { useConfirmAction } from "@/shared/hooks/use-confirm-action";
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
  const [listActionError, setListActionError] = useState("");

  const params = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [page, debouncedSearch, categoryFilter, statusFilter]);
  const motivos = useMotivosReprogramacion(params);
  const totalPages = Math.max(motivos.pages ?? 0, 1);
  const editor = useEditorDialog<MotivoReprogramacion>({
    busy: motivos.isSaving,
    confirmDiscardMessage: "¿Descartar los cambios sin guardar?",
  });
  const confirmation = useConfirmAction<MotivoReprogramacion>();
  const editingMotivo = editor.editingItem;

  const saveMotivo = async (values: MotivoReprogramacionFormValues) => {
    await motivos.saveItem(values, editingMotivo?.id);
    editor.finish();
    if (!editingMotivo) setPage(1);
  };

  const requestToggle = async (motivo: MotivoReprogramacion) => {
    setListActionError("");
    if (motivo.active) {
      confirmation.request(motivo);
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
    const pendingDeactivate = confirmation.item;
    if (!pendingDeactivate) return;
    confirmation.setError("");
    try {
      await motivos.toggleActive(pendingDeactivate);
      confirmation.close();
    } catch (error) {
      const apiError = parseApiError(error);
      confirmation.setError(apiError.status === 404
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
    dialogOpen: editor.open,
    editingMotivo,
    setFormDirty: editor.setDirty,
    openCreate: editor.openCreate,
    openEdit: editor.openEdit,
    closeDialog: editor.onOpenChange,
    saveMotivo,
    pendingDeactivate: confirmation.item,
    onConfirmationOpenChange: confirmation.onOpenChange,
    actionError: confirmation.error,
    listActionError,
    requestToggle,
    confirmDeactivate,
    clearFilters,
  };
}
