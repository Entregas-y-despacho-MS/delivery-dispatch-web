import api from "@/shared/lib/axios";
import type { SolicitudesCambioResponse } from "../change-requests.types";

export const solicitudesCambioService = {
  list: async (params: { page: number; limit: number; search?: string; date?: string }, signal?: AbortSignal) =>
    (await api.get<SolicitudesCambioResponse>("/dispatches/change-requests", { params, signal, skipErrorToast: true })).data,
  revealTrackingLink: async (id: number) =>
    (await api.post<{ dispatchId: number; trackingUrl: string }>(`/dispatches/change-requests/${id}/tracking-link`, {}, { skipErrorToast: true })).data,
};
