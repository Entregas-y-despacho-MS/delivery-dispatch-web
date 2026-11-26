import api from "@/shared/lib/axios";
import type { DisponibilidadFlota, ParamsDisponibilidad } from "../reportes.disponibilidad";

/** Disponibilidad, mantenimiento, carga y productividad de la flota (ST-303.1). Coordinador, supervisor o root. */
export async function obtenerDisponibilidadFlota(params: ParamsDisponibilidad, signal?: AbortSignal): Promise<DisponibilidadFlota> {
  const { data } = await api.get<DisponibilidadFlota>("/fleet/availability", { params, signal, skipErrorToast: true });
  return data;
}
