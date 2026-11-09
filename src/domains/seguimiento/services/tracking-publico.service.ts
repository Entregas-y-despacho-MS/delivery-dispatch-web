import { publicApi } from "@/shared/lib/public-api";
import type {
  CalificacionEntrega,
  CalificarEntregaInput,
  CodigoEnviado,
  FranjasDisponibles,
  PruebaVerificacion,
  SeguimientoPublico,
} from "../seguimiento.types";

const ruta = (token: string) => `/public/tracking/${encodeURIComponent(token)}`;
/** La prueba va en una cabecera: nunca en la URL ni en los logs. */
const conPrueba = (prueba: string) => ({ "X-Verification-Proof": prueba });

export async function obtenerSeguimiento(token: string, signal?: AbortSignal): Promise<SeguimientoPublico> {
  const { data } = await publicApi.get<SeguimientoPublico>(ruta(token), { signal });
  return data;
}

export async function confirmarEntrega(token: string): Promise<SeguimientoPublico> {
  const { data } = await publicApi.post<SeguimientoPublico>(`${ruta(token)}/confirm`);
  return data;
}

export async function solicitarCambio(token: string, detalle: string): Promise<SeguimientoPublico> {
  const { data } = await publicApi.post<SeguimientoPublico>(`${ruta(token)}/change-request`, { detail: detalle });
  return data;
}

/**
 * Califica la entrega (ST-42.1): solo si ya se entregó y una sola vez. 409 RATING_NOT_ALLOWED antes de
 * entregar y 409 RATING_ALREADY_SUBMITTED si ya se calificó. El comentario vacío no se manda.
 */
export async function calificarEntrega(token: string, { score, comment }: CalificarEntregaInput): Promise<CalificacionEntrega> {
  const texto = comment?.trim();
  const cuerpo: CalificarEntregaInput = texto ? { score, comment: texto } : { score };
  const { data } = await publicApi.post<CalificacionEntrega>(`${ruta(token)}/rating`, cuerpo);
  return data;
}

/** Envía un código de 6 dígitos al correo registrado; uno nuevo anula el anterior. */
export async function enviarCodigo(token: string): Promise<CodigoEnviado> {
  const { data } = await publicApi.post<CodigoEnviado>(`${ruta(token)}/verification-code`);
  return data;
}

export async function verificarCodigo(token: string, codigo: string): Promise<PruebaVerificacion> {
  const { data } = await publicApi.post<PruebaVerificacion>(`${ruta(token)}/verification-code/verify`, { code: codigo });
  return data;
}

export async function listarFranjas(token: string, prueba: string, signal?: AbortSignal): Promise<FranjasDisponibles> {
  const { data } = await publicApi.get<FranjasDisponibles>(`${ruta(token)}/slots`, { headers: conPrueba(prueba), signal });
  return data;
}

/** Mueve la entrega a la franja elegida. Gasta la prueba: otro cambio pide un código nuevo. */
export async function reprogramarEntrega(token: string, slotId: string, prueba: string): Promise<SeguimientoPublico> {
  const { data } = await publicApi.post<SeguimientoPublico>(`${ruta(token)}/reschedule`, { slotId }, { headers: conPrueba(prueba) });
  return data;
}
