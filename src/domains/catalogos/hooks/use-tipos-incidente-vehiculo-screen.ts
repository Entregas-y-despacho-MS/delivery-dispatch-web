import { useMemo, useState } from "react";

import { useDebounce } from "@/shared/hooks/use-debounce";
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
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeveridadFilter>("all");
  const [blockingFilter, setBlockingFilter] = useState<BloqueoFilter>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoIncidenteVehiculo>();
  const [formDirty, setFormDirty] = useState(false);
  const debouncedSearch = useDebounce(search.trim(), 300);

  const params = useMemo<TipoIncidenteVehiculoListParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    severity: severityFilter === "all" ? undefined : severityFilter,
    disablesVehicle: blockingFilter === "all" ? undefined : blockingFilter === "blocking",
  }), [page, debouncedSearch, severityFilter, blockingFilter]);
  const tipos = useTiposIncidenteVehiculo(params);
  const hasFilters = Boolean(search.trim()) || severityFilter !== "all" || blockingFilter !== "all";
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

  const clearFilters = () => {
    setSearch("");
    setSeverityFilter("all");
    setBlockingFilter("all");
    setPage(1);
  };

  return {
    tipos,
    search,
    setSearch: (value: string) => { setSearch(value); setPage(1); },
    severityFilter,
    setSeverityFilter: (value: SeveridadFilter) => { setSeverityFilter(value); setPage(1); },
    blockingFilter,
    setBlockingFilter: (value: BloqueoFilter) => { setBlockingFilter(value); setPage(1); },
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
