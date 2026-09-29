import { createCrudService, type PaginatedApiResponse } from "@/shared/lib/base.service";
import { tipoIncidenteVehiculoResponseSchema } from "../catalogos.schemas";
import type {
  TipoIncidenteVehiculo,
  TipoIncidenteVehiculoCreate,
  TipoIncidenteVehiculoListParams,
  TipoIncidenteVehiculoUpdate,
} from "../catalogos.types";

export const tiposIncidenteVehiculoService = createCrudService<
  TipoIncidenteVehiculo,
  TipoIncidenteVehiculo,
  TipoIncidenteVehiculoCreate,
  TipoIncidenteVehiculoUpdate,
  TipoIncidenteVehiculoListParams,
  PaginatedApiResponse<TipoIncidenteVehiculo>
>({
  endpoint: "/vehicle-incident-types",
  updateMethod: "put",
  requestConfig: { skipErrorToast: true },
  mapItem: (item) => tipoIncidenteVehiculoResponseSchema.parse(item),
  mapListResponse: ({ data, meta }) => ({
    items: data.map((item) => tipoIncidenteVehiculoResponseSchema.parse(item)),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});
