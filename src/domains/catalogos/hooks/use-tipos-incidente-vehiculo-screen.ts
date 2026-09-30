import { useMemo, useState } from "react";

import { useListFilters } from "@/shared/hooks/use-list-filters";
import type { TipoIncidenteVehiculoFormValues } from "../catalogos.schemas";
import type {
  SeveridadIncidenteVehiculo,
  TipoIncidenteVehiculo,
  TipoIncidenteVehiculoListParams,
} from "../catalogos.types";
import { useTiposIncidenteVehiculo } from "./use-tipos-incidente-vehiculo";

const PAGE_SIZE = 10;

export type SeveridadFilter = "all" | SeveridadIncidenteVehiculo;
export type BloqueoFilter = "all" | "blocking" | "nonblocking";

export function useTiposIncidenteVehiculoScreen() {
  const list = useListFilters<{ severity: SeveridadFilter; blocking: BloqueoFilter }>({
    severity: "all",
    blocking: "all",
  });
  const { search, debouncedSearch, page, setPage, clearFilters, hasFilters } = list;
  const severityFilter = list.filters.severity;
  const blockingFilter = list.filters.blocking;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoIncidenteVehiculo>();
  const [formDirty, setFormDirty] = useState(false);

  const params = useMemo<TipoIncidenteVehiculoListParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    severity: severityFilter === "all" ? undefined : severityFilter,
    disablesVehicle: blockingFilter === "all" ? undefined : blockingFilter === "blocking",
  }), [page, debouncedSearch, severityFilter, blockingFilter]);
  const tipos = useTiposIncidenteVehiculo(params);
  const totalPages = Math.max(tipos.pages ?? 0, 1);

  const openCreate = () => {
    setEditingTipo(undefined);
    setFormDirty(false);
    setDialogOpen(true);
  };

  const openEdit = (tipo: TipoIncidenteVehiculo) => {
    setEditingTipo(tipo);
    setFormDirty(false);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    if (tipos.isSaving) return;
    if (!open && formDirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
    setDialogOpen(open);
    if (!open) {
      setEditingTipo(undefined);
      setFormDirty(false);
    }
  };

  const saveTipo = async (values: TipoIncidenteVehiculoFormValues) => {
    await tipos.saveItem(values, editingTipo?.id);
    setDialogOpen(false);
    setEditingTipo(undefined);
    setFormDirty(false);
    if (!editingTipo) setPage(1);
  };

  return {
    tipos,
    search,
    setSearch: list.setSearch,
    severityFilter,
    setSeverityFilter: (value: SeveridadFilter) => list.setFilter("severity", value),
    blockingFilter,
    setBlockingFilter: (value: BloqueoFilter) => list.setFilter("blocking", value),
    page,
    setPage,
    totalPages,
    hasFilters,
    clearFilters,
    dialogOpen,
    editingTipo,
    setFormDirty,
    openCreate,
    openEdit,
    closeDialog,
    saveTipo,
  };
}
