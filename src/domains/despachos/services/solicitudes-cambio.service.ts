import api from "@/shared/lib/axios";
import { createCrudService } from "@/shared/lib/base.service";
import type {
  EnlaceSeguimiento,
  SolicitudCambio,
  SolicitudesCambioParams,
  SolicitudesCambioResponse,
} from "../solicitudes-cambio.types";

/** Bandeja de solicitudes de cambio del cliente (ST-224.1). Solo lectura: { data, meta } → ListResult. */
const solicitudesCambioCrudService = createCrudService<
  SolicitudCambio,
  SolicitudCambio,
  never,
  never,
  SolicitudesCambioParams,
  SolicitudesCambioResponse
>({
  endpoint: "/dispatches/change-requests",
  requestConfig: { skipErrorToast: true },
  mapListResponse: ({ data, meta }) => ({
    items: data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
    pages: Math.max(1, meta.pages),
  }),
});

/**
 * Pide el enlace de seguimiento de un cliente sin correo. Es la credencial del cliente: se pide al hacer
 * clic (cada pedido queda auditado) y quien llama no debe guardarlo ni ponerlo en la URL.
 */
export async function revelarEnlaceSeguimiento(dispatchId: number): Promise<EnlaceSeguimiento> {
  const { data } = await api.post<EnlaceSeguimiento>(`/dispatches/change-requests/${dispatchId}/tracking-link`, undefined, { skipErrorToast: true });
  return data;
}

export const solicitudesCambioService = {
  ...solicitudesCambioCrudService,
  revealTrackingLink: revelarEnlaceSeguimiento,
};
