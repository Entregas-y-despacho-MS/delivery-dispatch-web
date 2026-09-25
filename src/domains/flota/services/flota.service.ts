import { createCrudService } from "@/shared/lib/base.service";
import type {
  Vehiculo,
  VehiculoInput,
  VehiculoListParams,
  VehiculoUpdateInput,
  VehiclesResponse,
} from "../flota.types";

export const flotaService = createCrudService<
  Vehiculo,
  Vehiculo,
  VehiculoInput,
  VehiculoUpdateInput,
  VehiculoListParams,
  VehiclesResponse
>({
  endpoint: "/vehicles",
  updateMethod: "put",
  mapListResponse: ({ data, meta }) => ({
    items: data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});
