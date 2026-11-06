import type { ApiError } from "@/shared/lib/api-error";

/** Qué decirle al coordinador si no se pudo mostrar el enlace, y si hay que recargar la bandeja. */
export function errorEnlace(error: ApiError): { mensaje: string; recargar: boolean } {
  if (error.code === "CHANGE_REQUEST_NOT_PENDING") {
    return { mensaje: "Otro coordinador ya resolvió esta solicitud. Actualizamos la bandeja.", recargar: true };
  }
  if (error.code === "TRACKING_LINK_NOT_AVAILABLE") {
    return { mensaje: "El enlace de este cliente ya no está disponible. Actualizamos la bandeja.", recargar: true };
  }
  if (error.code === "DISPATCH_NOT_FOUND" || error.kind === "not-found") {
    return { mensaje: "Este despacho ya no existe. Actualizamos la bandeja.", recargar: true };
  }
  if (error.kind === "forbidden") return { mensaje: "Solo el coordinador puede ver el enlace de seguimiento.", recargar: false };
  return { mensaje: `No pudimos obtener el enlace. ${error.message}`, recargar: false };
}
