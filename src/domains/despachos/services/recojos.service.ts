import api from "@/shared/lib/axios";
import type { Almacen, CrearRecojoInput, Recojo, RecojoListParams, RecojosResponse } from "../recojos.types";

const RUTA = "/pickup-orders";

/**
 * Órdenes de recojo (ST-81.2). Listar: coordinador y supervisor. Crear y anular: solo coordinador.
 * Crear responde 201 con el recojo en `pickup_scheduled`; anular solo antes de que salga la ruta.
 */
export const recojosService = {
  listar: async (params: RecojoListParams, signal?: AbortSignal) => {
    const { data } = await api.get<RecojosResponse>(RUTA, { params, signal, skipErrorToast: true });
    return data;
  },
  crear: async (input: CrearRecojoInput) => {
    const { data } = await api.post<Recojo>(RUTA, input, { skipErrorToast: true });
    return data;
  },
  anular: async (id: number, motivo: string) => {
    const { data } = await api.patch<Recojo>(`${RUTA}/${id}/cancel`, { reason: motivo.trim() }, { skipErrorToast: true });
    return data;
  },
  /** Almacenes activos para el destino (el back admite hasta 100 por página). */
  listarAlmacenes: async (signal?: AbortSignal) => {
    const { data } = await api.get<{ data: Almacen[] }>("/warehouses", {
      params: { active: true, limit: 100 },
      signal,
      skipErrorToast: true,
    });
    return data.data;
  },
};
