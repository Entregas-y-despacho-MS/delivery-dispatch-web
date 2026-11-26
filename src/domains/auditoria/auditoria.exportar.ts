import { parseApiError } from "@/shared/lib/api-error";
import type { FiltrosAuditoria } from "./auditoria.reglas";

export type FormatoExportacion = "csv" | "pdf";

/** Máximo de filas que acepta el back por formato (ST-71.1): más que eso responde 400 y no manda archivo. */
export const MAX_FILAS_EXPORTACION: Record<FormatoExportacion, number> = { csv: 10_000, pdf: 2_000 };

/** «auditoria-admin_2026-11-19_a_2026-11-25.csv»: el formato y el período quedan en el nombre. */
export const nombreArchivoAuditoria = ({ desde, hasta }: Pick<FiltrosAuditoria, "desde" | "hasta">, formato: FormatoExportacion) =>
  `auditoria-admin_${desde}_a_${hasta}.${formato}`;

/** Si ya se sabe que el resultado supera el límite, se avisa antes de pedir el archivo. */
export const excedeLimite = (total: number, formato: FormatoExportacion) => total > MAX_FILAS_EXPORTACION[formato];

const formatoMiles = new Intl.NumberFormat("es-BO");
export const avisoLimite = (formato: FormatoExportacion) =>
  `El ${formato.toUpperCase()} admite hasta ${formatoMiles.format(MAX_FILAS_EXPORTACION[formato])} eventos. Acorta el rango o agrega filtros para exportar.`;

/**
 * Con `responseType: "blob"`, el cuerpo del error también llega como Blob: se convierte a JSON para que
 * `parseApiError` lea el `code` del back.
 */
export async function errorDeExportacion(error: unknown): Promise<unknown> {
  const respuesta = (error as { response?: { data?: unknown } } | null)?.response;
  if (respuesta?.data instanceof Blob) {
    try {
      respuesta.data = JSON.parse(await respuesta.data.text());
    } catch {
      respuesta.data = undefined;
    }
  }
  return error;
}

/** Mensaje recuperable: los filtros siguen en pantalla para corregir y volver a intentar. */
export function mensajeErrorExportacion(error: unknown, formato: FormatoExportacion): string {
  const apiError = parseApiError(error);
  if (apiError.code === "AUDIT_EXPORT_LIMIT_EXCEEDED") return avisoLimite(formato);
  if (apiError.code === "PDF_GENERATION_FAILED") return "No se pudo generar el PDF. Intenta de nuevo o exporta en CSV.";
  if (apiError.status === 403) return "No tienes permiso para exportar la auditoría.";
  if (apiError.code === "INVALID_AUDIT_RANGE" || apiError.code === "INVALID_AUDIT_FILTER") return "Revisa los filtros: el rango o la entidad no son válidos.";
  if (apiError.kind === "network") return "No pudimos conectarnos con el servidor. Revisa tu conexión e intenta de nuevo.";
  return `No se pudo exportar el ${formato.toUpperCase()}. Intenta de nuevo en un momento.`;
}

/** Descarga un Blob con el nombre dado (sin dejar el enlace en el DOM). */
export function guardarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
