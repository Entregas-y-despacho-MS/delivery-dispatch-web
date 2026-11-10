import api from "@/shared/lib/axios";
import type { ListResult } from "@/shared/lib/base.service";
import type { LoteDetalle, LoteResumen, LotesParams, LotesResponse } from "../types/lotes.types";

/** Lista de lotes filtrada por estado, fecha y revisor (GET /route-batches). */
export async function listarLotes(params: LotesParams, signal?: AbortSignal): Promise<ListResult<LoteResumen>> {
  const { data } = await api.get<LotesResponse>("/route-batches", { params, signal });
  return { items: data.data, total: data.meta.total, page: data.meta.page, pageSize: data.meta.limit, pages: data.meta.pages };
}

/** Detalle del lote con sus pedidos, versiones, capacidad y validación (GET /route-batches/:id). */
export async function obtenerLote(id: number, signal?: AbortSignal): Promise<LoteDetalle> {
  const { data } = await api.get<LoteDetalle>(`/route-batches/${id}`, { signal });
  return data;
}
