import api from "@/shared/lib/axios";

export interface PickupScheduleResponse {
  id: number;
  status: "scheduled";
  trackingCode: string;
  recordVersion: number;
  pickupWindow: { startsAt: string; endsAt: string };
}

/** Agenda el recojo con la primera franja compatible de proveedor y almacén. */
export async function programarRecojoProveedor(dispatchId: number): Promise<PickupScheduleResponse> {
  const { data } = await api.post<PickupScheduleResponse>(
    `/dispatches/${dispatchId}/pickup-schedule`,
    {},
    { skipErrorToast: true },
  );
  return data;
}
