import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCrud, type UseCrudOptions } from "@/shared/hooks/use-crud";
import { vehiculosService } from "../services/vehiculos.service";
import type { CambiarEstadoVehiculoInput, Vehiculo, VehiculoInput, VehiculoListParams, VehiculoUpdateInput } from "../flota.types";

export function useVehiculos(
  params?: VehiculoListParams,
  options: Omit<UseCrudOptions<VehiculoListParams, Vehiculo>, "params"> = {},
) {
  const queryClient = useQueryClient();
  const result = useCrud<Vehiculo, VehiculoInput, VehiculoUpdateInput, VehiculoListParams>(vehiculosService, "vehicles", {
    ...options,
    params,
    notifications: {
      created: "Vehículo registrado correctamente",
      updated: "Vehículo actualizado correctamente",
      deleted: "Vehículo dado de baja correctamente",
      ...options.notifications,
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CambiarEstadoVehiculoInput }) => vehiculosService.changeStatus(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: result.keys.all });
      toast.success("Estado del vehículo actualizado.");
    },
  });

  return {
    ...result,
    changeStatus: changeStatusMutation.mutateAsync,
    isChangingStatus: changeStatusMutation.isPending,
  };
}
