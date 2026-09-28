import { createCrudService, type PaginatedApiResponse } from "@/shared/lib/base.service";
import { motivoReprogramacionResponseSchema } from "../catalogos.schemas";
import type {
  MotivoReprogramacion,
  MotivoReprogramacionCreate,
  MotivoReprogramacionListParams,
  MotivoReprogramacionUpdate,
} from "../catalogos.types";

export const motivosReprogramacionService = createCrudService<
  MotivoReprogramacion,
  MotivoReprogramacion,
  MotivoReprogramacionCreate,
  MotivoReprogramacionUpdate,
  MotivoReprogramacionListParams,
  PaginatedApiResponse<MotivoReprogramacion>
>({
  endpoint: "/reschedule-reasons",
  updateMethod: "put",
  requestConfig: { skipErrorToast: true },
  mapItem: (item) => motivoReprogramacionResponseSchema.parse(item),
  mapListResponse: ({ data, meta }) => ({
    items: data.map((item) => motivoReprogramacionResponseSchema.parse(item)),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});
