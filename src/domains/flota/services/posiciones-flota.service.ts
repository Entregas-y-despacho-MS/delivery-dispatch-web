import api from "@/shared/lib/axios";
import type { PosicionFlotaEnVivo } from "../types/flota-posiciones.types";

/** Una posición por lote que sigue en ejecución. Requiere coordinador/supervisor. */
export async function obtenerPosicionesFlota(signal?: AbortSignal): Promise<PosicionFlotaEnVivo[]> {
  const { data } = await api.get<PosicionFlotaEnVivo[]>("/fleet/live-positions", { signal, skipErrorToast: true });
  return data;
}
