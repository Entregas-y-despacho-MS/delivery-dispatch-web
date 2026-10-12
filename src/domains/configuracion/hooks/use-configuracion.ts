import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCrud } from "@/shared/hooks/use-crud";
import { parseApiError } from "@/shared/lib/api-error";
import { planificarGuardado } from "../configuracion.guardado";
import { validarParametro } from "../configuracion.reglas";
import { CLAVES_PARAMETROS_OPERATIVOS } from "../configuracion.schemas";
import type {
  ClaveParametroOperativo,
  EstadoValorParametro,
  ParametroSistema,
  ParametrosOperativos,
} from "../configuracion.types";
import { parametrosService, type ActualizarParametroPayload } from "../services/configuracion.service";

/** El back marca en la descripción los valores de demostración o sin definir (plan, 6.4). */
function estadoDelValor(clave: ClaveParametroOperativo, parametro: ParametroSistema | undefined): EstadoValorParametro {
  if (!parametro || /^not configured/i.test(parametro.description ?? "")) return "sin-definir";
  // Vacío solo es "sin definir" si la regla no lo admite: en feriados, vacío significa "sin feriados".
  if (parametro.value === "" && validarParametro(clave, "") !== null) return "sin-definir";
  if (/\b(proposed|example)\b/i.test(parametro.description ?? "")) return "propuesto";
  return "definido";
}

/** Error al guardar: la clave que el back rechazó y su mensaje, para mostrarlo bajo ese campo. */
export interface ErrorGuardado {
  clave?: ClaveParametroOperativo;
  mensaje: string;
}

/**
 * Parámetros operativos del coordinador (ST-57.1): carga los valores actuales y guarda solo lo que
 * cambió, clave por clave y en un orden que el back siempre acepta.
 */
export function useParametrosOperativos() {
  const queryClient = useQueryClient();
  const parametros = useCrud<ParametroSistema, never, ActualizarParametroPayload>(parametrosService, "settings", {
    policy: "catalog",
  });
  const [guardando, setGuardando] = useState(false);

  const porClave = useMemo(
    () => new Map(parametros.data.map((parametro) => [parametro.key, parametro])),
    [parametros.data],
  );

  const valores = useMemo(
    () => Object.fromEntries(
      CLAVES_PARAMETROS_OPERATIVOS.map((clave) => [clave, porClave.get(clave)?.value ?? ""]),
    ) as ParametrosOperativos,
    [porClave],
  );

  const ventanaGeneral = useMemo(() => {
    const inicio = porClave.get("delivery_window_start")?.value;
    const fin = porClave.get("delivery_window_end")?.value;
    return inicio && fin ? { inicio, fin } : undefined;
  }, [porClave]);

  const estados = useMemo(
    () => Object.fromEntries(
      CLAVES_PARAMETROS_OPERATIVOS.map((clave) => [clave, estadoDelValor(clave, porClave.get(clave))]),
    ) as Record<ClaveParametroOperativo, EstadoValorParametro>,
    [porClave],
  );

  const clavesSinDefinir = useMemo(
    () => new Set(CLAVES_PARAMETROS_OPERATIVOS.filter((clave) => valores[clave] === "")),
    [valores],
  );

  /**
   * Guarda los cambios. Si el back rechaza una clave, se detiene ahí (lo anterior ya quedó guardado)
   * y devuelve el error para mostrarlo bajo ese campo. Devuelve null si todo salió bien.
   */
  const guardar = async (nuevos: ParametrosOperativos): Promise<ErrorGuardado | null> => {
    const cambios = planificarGuardado(valores, nuevos, ventanaGeneral);
    if (cambios === null) return { mensaje: "Revisa los campos marcados: hay valores que no cumplen las reglas." };
    if (cambios.length === 0) {
      toast.info("No hay cambios para guardar.");
      return null;
    }

    setGuardando(true);
    try {
      for (const { clave, valor } of cambios) {
        try {
          await parametrosService.update(clave, { value: valor });
        } catch (error) {
          const apiError = parseApiError(error);
          return {
            clave,
            mensaje: apiError.status === 403
              ? "Solo el coordinador puede modificar los parámetros operativos."
              : apiError.code === "INVALID_SETTING_VALUE"
                ? `El servidor rechazó este valor: ${apiError.message}`
                : "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.",
          };
        }
      }
      toast.success(cambios.length === 1 ? "Parámetro guardado." : `${cambios.length} parámetros guardados.`);
      return null;
    } finally {
      // Aunque falle a la mitad, lo que sí se guardó debe verse al recargar.
      await queryClient.invalidateQueries({ queryKey: parametros.keys.all });
      setGuardando(false);
    }
  };

  return { parametros, valores, ventanaGeneral, estados, clavesSinDefinir, guardar, guardando };
}
