import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import type {
  CambiarEstadoVehiculoInput,
  Vehiculo,
  VehiculoInput,
  VehiculoListParams,
  VehiculoUpdateInput,
  VehiclesResponse,
} from "../types/flota.types";

const crudService = createCrudService<
  Vehiculo,
  Vehiculo,
  VehiculoInput,
  VehiculoUpdateInput,
  VehiculoListParams,
  VehiclesResponse
>({
  endpoint: "/vehicles",
  requestConfig: { skipErrorToast: true },
  updateMethod: "put",
  mapListResponse: ({ data, meta }) => ({
    items: data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});

export const vehiculosService = {
  ...crudService,
  changeStatus: async (id: number, payload: CambiarEstadoVehiculoInput) => {
    const { data } = await api.patch<Vehiculo>(`/vehicles/${id}/status`, payload, { skipErrorToast: true });
    return data;
  },
  getRouteBatchStatus: async (id: number) => {
    const { data } = await api.get<{ status: string }>(`/route-batches/${id}`, { skipErrorToast: true });
    return data.status;
  },
};
