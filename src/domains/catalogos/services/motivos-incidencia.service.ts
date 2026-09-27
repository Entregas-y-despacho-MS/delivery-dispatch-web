import { createCrudService, type PaginatedApiResponse } from "@/shared/lib/base.service";
import type {
  MotivoIncidencia,
  MotivoIncidenciaCreate,
  MotivoIncidenciaListParams,
  MotivoIncidenciaUpdate,
} from "../catalogos.types";

export const motivosIncidenciaService = createCrudService<
  MotivoIncidencia,
  MotivoIncidencia,
  MotivoIncidenciaCreate,
  MotivoIncidenciaUpdate,
  MotivoIncidenciaListParams,
  PaginatedApiResponse<MotivoIncidencia>
>({
  endpoint: "/incident-reasons",
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
