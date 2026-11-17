import api from "@/shared/lib/axios";

export interface ReprogramacionInternaPayload { reasonCode: string; windowStart: string; windowEnd: string; instructions?: string }
export interface DevolucionAlmacenPayload { reasonCode?: string; notes?: string }

export const reprogramacionInternaService = {
  reprogramar: async (id: number, payload: ReprogramacionInternaPayload) => (await api.post(`/dispatches/${id}/reschedule`, payload, { skipErrorToast: true })).data,
  devolver: async (id: number, payload: DevolucionAlmacenPayload = {}) => (await api.post(`/dispatches/${id}/return`, payload, { skipErrorToast: true })).data,
};
