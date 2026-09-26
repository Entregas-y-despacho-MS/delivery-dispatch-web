import { useCrud, type UseCrudOptions } from "@/shared/hooks/use-crud";
import { zonasService } from "../services/zonas.service";
import type { Zona, ZonaInput, ZonaListParams } from "../catalogos.types";

export function useZonas(
  params?: ZonaListParams,
  options: Omit<UseCrudOptions<ZonaListParams, Zona>, "params"> = {},
) {
  return useCrud<Zona, ZonaInput, ZonaInput, ZonaListParams>(zonasService, "delivery-zones", {
    ...options,
    params,
    notifications: {
      created: "Zona creada correctamente",
      updated: "Zona actualizada correctamente",
      deleted: "Zona desactivada correctamente",
      ...options.notifications,
    },
  });
}
