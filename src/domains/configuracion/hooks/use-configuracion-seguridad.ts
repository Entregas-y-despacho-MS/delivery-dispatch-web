import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCrud } from "@/shared/hooks/use-crud";
import { parseApiError } from "@/shared/lib/api-error";
import { PASSWORD_KEYS, type PasswordValues } from "../configuracion.seguridad";
import { parametrosService, type ActualizarParametroPayload } from "../services/configuracion.service";
import type { ParametroSistema } from "../types/configuracion.types";

export function useConfiguracionSeguridad() {
  const queryClient = useQueryClient();
  const parametros = useCrud<ParametroSistema, never, ActualizarParametroPayload>(
    parametrosService, "settings", { policy: "catalog" },
  );
  const [guardando, setGuardando] = useState(false);
  const valores = useMemo(() => {
    const porClave = new Map(parametros.data.map((p) => [p.key, p.value]));
    if (PASSWORD_KEYS.some((key) => !porClave.has(key))) return null;
    return Object.fromEntries(PASSWORD_KEYS.map((key) => [key, porClave.get(key)])) as PasswordValues;
  }, [parametros.data]);

  const guardar = async (nuevos: PasswordValues): Promise<string | null> => {
    if (!valores) return "Faltan valores de seguridad en el servidor.";
    setGuardando(true);
    let guardados = 0;
    try {
      for (const key of PASSWORD_KEYS) {
        if (nuevos[key] === valores[key]) continue;
        try {
          await parametrosService.update(key, { value: nuevos[key] });
          guardados++;
        } catch (error) {
          const parsed = parseApiError(error);
          if (parsed.status === 403) return "Tu rol no puede modificar la política de contraseñas.";
          if (parsed.code === "INVALID_SETTING_VALUE") return `No se guardó ${key}: ${parsed.message}`;
          return "No se pudieron guardar todos los cambios. Revisa la conexión y vuelve a intentarlo.";
        }
      }
      if (guardados) toast.success("Política de contraseñas guardada.");
      return null;
    } finally {
      await queryClient.invalidateQueries({ queryKey: parametros.keys.all });
      setGuardando(false);
    }
  };
  return { parametros, valores, guardar, guardando };
}
