import api from "@/shared/lib/axios";
import type { DictamenInput, ReclamoDetalle, ReclamosParams, ReclamosResponse } from "../types/reclamos.types";

/*
 * Bandeja de reclamos (ST-45.2). Coordinador, supervisor o root. Cada comando manda la versión que se leyó
 * (`expectedVersion`): si el CRM mandó una más nueva el back responde 409 y no cambia nada.
 * Los errores se muestran en la pantalla, sin toast global.
 */
const BASE = "/complaint-cases";

export async function listarReclamos(params: ReclamosParams, signal?: AbortSignal): Promise<ReclamosResponse> {
  const { data } = await api.get<ReclamosResponse>(BASE, { params, signal, skipErrorToast: true });
  return data;
}

export async function obtenerReclamo(id: number, signal?: AbortSignal): Promise<ReclamoDetalle> {
  const { data } = await api.get<ReclamoDetalle>(`${BASE}/${id}`, { signal, skipErrorToast: true });
  return data;
}

/** Sin `assigneeUserId`, quien lo pide toma el caso. */
export async function tomarReclamo(id: number, version: number): Promise<ReclamoDetalle> {
  const { data } = await api.post<ReclamoDetalle>(`${BASE}/${id}/assign`, { expectedVersion: version }, { skipErrorToast: true });
  return data;
}

export async function iniciarInvestigacion(id: number, version: number): Promise<ReclamoDetalle> {
  const { data } = await api.post<ReclamoDetalle>(`${BASE}/${id}/start-investigation`, { expectedVersion: version }, { skipErrorToast: true });
  return data;
}

/** request_RMA deja el caso con autorización pendiente y encola la solicitud a Inventarios; no crea recojo. */
export async function emitirDictamen(id: number, version: number, dictamen: DictamenInput): Promise<ReclamoDetalle> {
  const { data } = await api.post<ReclamoDetalle>(`${BASE}/${id}/verdict`, { ...dictamen, expectedVersion: version }, { skipErrorToast: true });
  return data;
}
