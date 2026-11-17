import { createCrudService } from "@/shared/lib/base.service";
import type {
  PedidoPendiente,
  PedidosPendientesParams,
  PedidosPendientesResponse,
} from "../types/despachos.types";

/**
 * Bandeja central de pedidos pendientes de planificación (ST-48.2, RF-A40).
 * Solo lectura: el back responde { data, total, page, limit } y aquí se adapta
 * al ListResult que entiende useCrud.
 */
export const pedidosPendientesService = createCrudService<
  PedidoPendiente,
  PedidoPendiente,
  never,
  never,
  PedidosPendientesParams,
  PedidosPendientesResponse
>({
  endpoint: "/pending-orders",
  requestConfig: { skipErrorToast: true },
  mapListResponse: ({ data, total, page, limit }) => ({
    items: data,
    total,
    page,
    pageSize: limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  }),
});
