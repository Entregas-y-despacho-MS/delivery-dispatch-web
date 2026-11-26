import api from "@/shared/lib/axios";
import { errorDeExportacion, type FormatoExportacion } from "../auditoria.exportar";
import type { AuditoriaParams, AuditoriaResponse } from "../types/auditoria.types";

/**
 * Auditoría administrativa (ST-70.1). Solo admin y root; el back filtra los campos según el rol
 * (`ip` y `metadata` solo para root), así que la pantalla nunca recibe lo que no puede mostrar.
 */
export async function buscarEventosAuditoria(params: AuditoriaParams, signal?: AbortSignal): Promise<AuditoriaResponse> {
  const { data } = await api.get<AuditoriaResponse>("/audit/admin-events", { params, signal, skipErrorToast: true });
  return data;
}

/**
 * Exportación (ST-71.1): exactamente la misma consulta (ventana, filtros y orden) sin paginar. El back
 * valida el límite antes de generar el archivo: si lo supera responde 400 y no manda nada.
 */
export async function exportarEventosAuditoria(
  params: AuditoriaParams,
  formato: FormatoExportacion,
  onProgreso?: (porcentaje: number | null) => void,
): Promise<Blob> {
  try {
    const { data } = await api.get<Blob>("/audit/admin-events/export", {
      params: { ...params, format: formato },
      responseType: "blob",
      skipErrorToast: true,
      onDownloadProgress: (evento) => onProgreso?.(evento.total ? Math.round((evento.loaded / evento.total) * 100) : null),
    });
    return data;
  } catch (error) {
    throw await errorDeExportacion(error);
  }
}
