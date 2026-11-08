import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { errorGuardadoUmbrales, type ErrorUmbrales } from "../configuracion.umbrales";
import type { UmbralesAlerta } from "../configuracion.types";
import { guardarUmbrales, obtenerUmbrales } from "../services/umbrales.service";

export const umbralesKeys = createQueryKeys("alert-thresholds");
const CLAVE_ACTUALES = umbralesKeys.detail("actuales");

/**
 * Umbrales de alerta del supervisor (ST-67.2): carga los valores actuales y los guarda los tres juntos.
 * Al guardar, la respuesta del back reemplaza la caché y se muestra un toast.
 */
export function useUmbralesAlerta() {
  const queryClient = useQueryClient();
  const umbrales = useQuery({
    queryKey: CLAVE_ACTUALES,
    queryFn: ({ signal }) => obtenerUmbrales(signal),
    ...QUERY_POLICIES.catalog,
  });

  const mutacion = useMutation({
    mutationFn: guardarUmbrales,
    onSuccess: (guardados) => {
      queryClient.setQueryData(CLAVE_ACTUALES, guardados);
      toast.success("Umbrales de alerta guardados.");
    },
  });

  /** Devuelve null si se guardó, o el error para mostrarlo en el formulario. */
  const guardar = async (valores: UmbralesAlerta): Promise<ErrorUmbrales | null> => {
    try {
      await mutacion.mutateAsync(valores);
      return null;
    } catch (error) {
      return errorGuardadoUmbrales(error);
    }
  };

  return { umbrales, guardar, guardando: mutacion.isPending };
}
