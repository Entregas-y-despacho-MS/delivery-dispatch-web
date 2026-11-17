import api from "@/shared/lib/axios";

export interface ReprogramarPayload {
  reasonCode: string;
  windowStart: string;
  windowEnd: string;
  instructions?: string | null;
}

export interface ReprogramacionHecha {
  dispatchId: number;
  status: string;
  rescheduleId: number;
  version: number;
  windowStart: string;
  windowEnd: string;
  shift: "morning" | "afternoon";
  attemptsUsed: number;
  attemptsLimit: number;
}

export interface DevolucionHecha {
  dispatchId: number;
  status: string;
  previousStatus: string;
  closedAt: string;
  reasonCode: string | null;
  attemptsUsed: number;
  attemptsLimit: number;
}

export async function reprogramarDespacho(id: number, payload: ReprogramarPayload): Promise<ReprogramacionHecha> {
  const { data } = await api.post<ReprogramacionHecha>(`/dispatches/${id}/reschedule`, payload, { skipErrorToast: true });
  return data;
}

export async function devolverAlAlmacen(id: number, notas: string | null): Promise<DevolucionHecha> {
  const { data } = await api.post<DevolucionHecha>(`/dispatches/${id}/return`, { notes: notas }, { skipErrorToast: true });
  return data;
}
