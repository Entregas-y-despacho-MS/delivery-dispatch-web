import api from "@/shared/lib/axios";
import type { AlertaOperativa, ParamsAlertas, RespuestaAlertas } from "../types/incidencias.types";

/** Alertas operativas (ST-66.2): coordinador y supervisor. Sin `status` devuelve abiertas y atendidas. */
export async function listarAlertas(params: ParamsAlertas, signal?: AbortSignal): Promise<RespuestaAlertas> {
  const { data } = await api.get<RespuestaAlertas>("/alerts", { params, signal, skipErrorToast: true });
  return data;
}

/** Marca la alerta como atendida. 409 si alguien ya la atendió; 404 si no existe. */
export async function atenderAlerta(id: number): Promise<AlertaOperativa> {
  const { data } = await api.patch<AlertaOperativa>(`/alerts/${id}/acknowledge`, undefined, { skipErrorToast: true });
  return data;
}
