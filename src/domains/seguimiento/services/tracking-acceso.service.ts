import { publicApi } from "@/shared/lib/public-api";
import type { AccesoCodigoAceptado, SeguimientoPorSesion, SesionSeguimiento } from "../types/seguimiento.types";

/*
 * Acceso por código de seguimiento (ST-309.2) contra /public/tracking/access (ST-309.1). Los códigos van en el
 * cuerpo y la sesión en una cabecera: nada de esto pasa por la URL ni por el historial.
 */
const BASE = "/public/tracking/access";

/** Siempre responde igual: no dice si el código existe ni si se envió algo. */
export async function pedirCodigoAcceso(codigoSeguimiento: string): Promise<AccesoCodigoAceptado> {
  const { data } = await publicApi.post<AccesoCodigoAceptado>(`${BASE}/code`, { trackingCode: codigoSeguimiento });
  return data;
}

/** 400 INVALID_ACCESS_CODE para cualquier fallo (inexistente, vencido, usado o incorrecto). */
export async function verificarCodigoAcceso(codigoSeguimiento: string, codigo: string): Promise<SesionSeguimiento> {
  const { data } = await publicApi.post<SesionSeguimiento>(`${BASE}/verify`, { trackingCode: codigoSeguimiento, code: codigo });
  return data;
}

/** 401 TRACKING_SESSION_INVALID cuando la sesión venció o no existe. */
export async function verSeguimientoPorSesion(sesion: string, signal?: AbortSignal): Promise<SeguimientoPorSesion> {
  const { data } = await publicApi.get<SeguimientoPorSesion>(`${BASE}/view`, { headers: { "X-Tracking-Session": sesion }, signal });
  return data;
}
