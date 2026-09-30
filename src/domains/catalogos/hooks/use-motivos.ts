import { toast } from "sonner";

import { useCrud } from "@/shared/hooks/use-crud";
import type { MotivoIncidenciaFormValues } from "../catalogos.schemas";
import type {
  MotivoIncidencia,
  MotivoIncidenciaCreate,
  MotivoIncidenciaListParams,
  MotivoIncidenciaUpdate,
} from "../catalogos.types";
import { motivosIncidenciaService } from "../services/motivos-incidencia.service";

export function useMotivosIncidencia(params: MotivoIncidenciaListParams) {
  const crud = useCrud<
    MotivoIncidencia,
    MotivoIncidenciaCreate,
    MotivoIncidenciaUpdate,
    MotivoIncidenciaListParams
  >(motivosIncidenciaService, "incident-reasons", { params, policy: "catalog" });

  const saveItem = async ({ active, ...values }: MotivoIncidenciaFormValues, id?: number) => {
    if (id === undefined) {
      // El backend rechaza `active` al crear: todo motivo nuevo nace activo.
      await crud.createItem(values);
      toast.success("Motivo de incidencia creado");
      return;
    }

    await crud.updateItem({ id, data: { ...values, active } });
    toast.success("Motivo de incidencia actualizado");
  };

  const toggleActive = async (item: MotivoIncidencia) => {
    await crud.updateItem({ id: item.id, data: { active: !item.active } });
    toast.success(item.active ? "Motivo desactivado" : "Motivo activado");
  };

  return { ...crud, saveItem, toggleActive };
}
