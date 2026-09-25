import { useCrud, type UseCrudOptions } from "@/shared/hooks/use-crud";
import { flotaService } from "../services/flota.service";
import type { Vehiculo, VehiculoInput, VehiculoListParams, VehiculoUpdateInput } from "../flota.types";

export function useFlota(
  params?: VehiculoListParams,
  options: Omit<UseCrudOptions<VehiculoListParams, Vehiculo>, "params"> = {},
) {
  return useCrud<Vehiculo, VehiculoInput, VehiculoUpdateInput, VehiculoListParams>(flotaService, "vehicles", {
    ...options,
    params,
    notifications: {
      created: "Vehículo registrado correctamente",
      updated: "Vehículo actualizado correctamente",
      deleted: "Vehículo dado de baja correctamente",
      ...options.notifications,
    },
  });
}
