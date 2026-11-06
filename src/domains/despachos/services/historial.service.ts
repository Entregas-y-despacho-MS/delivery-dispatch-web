import api from "@/shared/lib/axios";
import type { HistorialParams, HistorialResponse } from "../historial.types";

export const historialService = {
  list: async (params: HistorialParams, signal?: AbortSignal) => (await api.get<HistorialResponse>("/dispatches/history", { params, signal })).data,
  exportCsv: async (params: Omit<HistorialParams, "page" | "limit">) => (await api.get<Blob>("/dispatches/history/export", { params, responseType: "blob" })).data,
};
