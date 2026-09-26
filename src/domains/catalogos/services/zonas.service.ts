import { createCrudService } from "@/shared/lib/base.service";
import type {
  DeliveryZonesResponse,
  Zona,
  ZonaInput,
  ZonaListParams,
} from "../catalogos.types";

export const zonasService = createCrudService<
  Zona,
  Zona,
  ZonaInput,
  ZonaInput,
  ZonaListParams,
  DeliveryZonesResponse
>({
  endpoint: "/delivery-zones",
  updateMethod: "put",
  mapListResponse: ({ data, meta }) => ({
    items: data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: meta.pages,
  }),
});
