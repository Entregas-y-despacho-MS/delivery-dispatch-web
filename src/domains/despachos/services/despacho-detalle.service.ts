import api from "@/shared/lib/axios";
import type { DespachoDetalle } from "../despacho-detalle.types";

/** Ficha 360°: cada llamada trae URL de evidencias nuevas (vencen a los 5 minutos). */
export async function obtenerDetalleDespacho(id: number, signal?: AbortSignal): Promise<DespachoDetalle> {
  const { data } = await api.get<DespachoDetalle>(`/dispatches/${id}/detail`, { signal, skipErrorToast: true });
  return data;
}
