import { toast } from "sonner";

import { useCrud } from "@/shared/hooks/use-crud";
import type { MotivoReprogramacionFormValues } from "../catalogos.schemas";
import type {
  MotivoReprogramacion,
  MotivoReprogramacionCreate,
  MotivoReprogramacionListParams,
  MotivoReprogramacionUpdate,
} from "../catalogos.types";
import { motivosReprogramacionService } from "../services/motivos-reprogramacion.service";

export function useMotivosReprogramacion(params: MotivoReprogramacionListParams) {
  const crud = useCrud<
    MotivoReprogramacion,
    MotivoReprogramacionCreate,
    MotivoReprogramacionUpdate,
    MotivoReprogramacionListParams
  >(motivosReprogramacionService, "reschedule-reasons", { params, policy: "catalog" });

  const saveItem = async (values: MotivoReprogramacionFormValues, id?: number) => {
    if (id === undefined) {
      await crud.createItem(values);
      toast.success("Motivo creado");
      return;
    }

    await crud.updateItem({ id, data: values });
    toast.success("Motivo actualizado");
  };

  const toggleActive = async (item: MotivoReprogramacion) => {
    await crud.updateItem({ id: item.id, data: { active: !item.active } });
    toast.success(item.active ? "Motivo desactivado" : "Motivo activado");
  };

  return {
    data: crud.data,
    total: crud.total,
    page: crud.page,
    pages: crud.pages,
    isLoading: crud.isLoading,
    isFetching: crud.isFetching,
    isError: crud.isError,
    error: crud.error,
    isSaving: crud.isSaving,
    refetch: crud.refetch,
    saveItem,
    toggleActive,
  };
}
