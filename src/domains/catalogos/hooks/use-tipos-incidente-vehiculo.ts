import { useCrud } from "@/shared/hooks/use-crud";
import type { TipoIncidenteVehiculoFormValues } from "../catalogos.schemas";
import type {
  TipoIncidenteVehiculo,
  TipoIncidenteVehiculoCreate,
  TipoIncidenteVehiculoListParams,
  TipoIncidenteVehiculoUpdate,
} from "../catalogos.types";
import { tiposIncidenteVehiculoService } from "../services/tipos-incidente-vehiculo.service";

export function useTiposIncidenteVehiculo(params: TipoIncidenteVehiculoListParams) {
  const crud = useCrud<
    TipoIncidenteVehiculo,
    TipoIncidenteVehiculoCreate,
    TipoIncidenteVehiculoUpdate,
    TipoIncidenteVehiculoListParams
  >(tiposIncidenteVehiculoService, "vehicle-incident-types", {
    params,
    notifications: {
      created: "Tipo de falla creado",
      updated: "Tipo de falla actualizado",
    },
  });

  const saveItem = async (values: TipoIncidenteVehiculoFormValues, id?: number) => {
    if (id === undefined) {
      await crud.createItem(values);
      return;
    }
    await crud.updateItem({ id, data: values });
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
  };
}
