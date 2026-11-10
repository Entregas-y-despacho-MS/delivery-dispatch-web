import { createCrudService } from "@/shared/lib/base.service";
import type { ParametroSistema } from "../types/configuracion.types";

/** Cuerpo de PUT /settings/:key. El back recibe siempre texto ("15", "08:00", "1,2,3"). */
export interface ActualizarParametroPayload {
  value: string;
}

/**
 * Parámetros del sistema (ST-57.2):
 * - list → GET /settings: todas las claves (admin, coordinador o root).
 * - update(clave, { value }) → PUT /settings/:clave: una clave por petición, solo coordinador o root.
 *   El back valida cada valor contra los demás y responde 400 INVALID_SETTING_VALUE si no cuadra.
 */
export const parametrosService = createCrudService<
  ParametroSistema,
  ParametroSistema,
  never,
  ActualizarParametroPayload
>({
  endpoint: "/settings",
  updateMethod: "put",
  requestConfig: { skipErrorToast: true },
});
