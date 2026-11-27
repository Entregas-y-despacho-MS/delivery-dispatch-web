import api from "@/shared/lib/axios";
import type { AuditoriaParams, AuditoriaResponse } from "../types/auditoria.types";

/**
 * Auditoría administrativa (ST-70.1). Solo admin y root; el back filtra los campos según el rol
 * (`ip` y `metadata` solo para root), así que la pantalla nunca recibe lo que no puede mostrar.
 */
export async function buscarEventosAuditoria(params: AuditoriaParams, signal?: AbortSignal): Promise<AuditoriaResponse> {
  const { data } = await api.get<AuditoriaResponse>("/audit/admin-events", { params, signal, skipErrorToast: true });
  return data;
}
