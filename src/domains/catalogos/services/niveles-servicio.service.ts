import { createCrudService, type PaginatedApiResponse } from "@/shared/lib/base.service";
import type {
  NivelServicio,
  NivelServicioCreate,
  NivelServicioListParams,
  NivelServicioUpdate,
} from "../catalogos.types";

export const nivelesServicioService = createCrudService<
  NivelServicio,
  NivelServicio,
  NivelServicioCreate,
  NivelServicioUpdate,
  NivelServicioListParams,
  PaginatedApiResponse<NivelServicio>
>({
  endpoint: "/service-levels",
  updateMethod: "put",
  requestConfig: { skipErrorToast: true },
  mapListResponse: ({ data, meta }) => ({
    items: data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});
