import { toast } from "sonner";

import { useCrud } from "@/shared/hooks/use-crud";
import type { NivelServicioFormValues } from "../catalogos.schemas";
import type {
  NivelServicio,
  NivelServicioCreate,
  NivelServicioListParams,
  NivelServicioUpdate,
} from "../catalogos.types";
import { nivelesServicioService } from "../services/niveles-servicio.service";

export function useNivelesServicio(params: NivelServicioListParams) {
  const crud = useCrud<
    NivelServicio,
    NivelServicioCreate,
    NivelServicioUpdate,
    NivelServicioListParams
  >(nivelesServicioService, "service-levels", { params });

  const saveItem = async (values: NivelServicioFormValues, id?: number) => {
    if (id === undefined) {
      await crud.createItem(values);
      toast.success("Nivel de servicio creado");
      return;
    }

    await crud.updateItem({ id, data: values });
    toast.success("Nivel de servicio actualizado");
  };

  const toggleActive = async (item: NivelServicio) => {
    await crud.updateItem({ id: item.id, data: { active: !item.active } });
    toast.success(item.active ? "Nivel de servicio desactivado" : "Nivel de servicio activado");
  };

  const removeItem = async (id: number) => {
    await crud.deleteItem(id);
    toast.success("Nivel de servicio eliminado");
  };

  return { ...crud, saveItem, toggleActive, removeItem };
}
