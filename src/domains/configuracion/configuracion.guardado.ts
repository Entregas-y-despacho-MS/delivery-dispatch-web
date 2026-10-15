import { parseApiError } from "@/shared/lib/api-error";
import { validarCruces, validarParametro } from "./configuracion.reglas";
import type { ClaveParametroOperativo } from "./configuracion.types";

export interface CambioParametro {
  clave: ClaveParametroOperativo;
  valor: string;
}

type Valores = Partial<Record<ClaveParametroOperativo, string>>;

/**
 * Decide qué claves enviar y en qué orden.
 *
 * El back recibe una clave por PUT y, en cada uno, valida la configuración completa con los valores
 * que ya tiene guardados. Si el coordinador mueve la mañana de 09–13 a 14–16 y se envía primero el
 * inicio (14:00), el back lo rechaza porque 14:00 no es antes de 13:00. Aquí se elige un orden en el
 * que cada paso intermedio también cumple las reglas, simulando el estado del back después de cada PUT.
 *
 * - Solo se envían las claves que cambiaron.
 * - Un vacío que el back no acepta (una clave que sigue sin definirse) no se envía.
 * - Devuelve null si no existe un orden válido (no debería pasar si el formulario ya es válido).
 */
export function planificarGuardado(
  actuales: Valores,
  nuevos: Valores,
  ventanaGeneral?: { inicio: string; fin: string },
): CambioParametro[] | null {
  const pendientes: CambioParametro[] = (Object.keys(nuevos) as ClaveParametroOperativo[])
    .filter((clave) => nuevos[clave] !== undefined && nuevos[clave] !== (actuales[clave] ?? ""))
    .map((clave) => ({ clave, valor: nuevos[clave] ?? "" }))
    .filter(({ clave, valor }) => valor !== "" || validarParametro(clave, "") === null);

  const errores = (valores: Valores) => validarCruces(valores, ventanaGeneral).length;
  const estado: Valores = { ...actuales };
  const orden: CambioParametro[] = [];

  while (pendientes.length > 0) {
    const erroresActuales = errores(estado);
    // El primero que, aplicado sobre lo que el back ya tiene, no deja la configuración peor que antes.
    const indice = pendientes.findIndex(({ clave, valor }) => errores({ ...estado, [clave]: valor }) <= erroresActuales);
    if (indice === -1) return null;
    const [cambio] = pendientes.splice(indice, 1);
    estado[cambio.clave] = cambio.valor;
    orden.push(cambio);
  }

  return errores(estado) === 0 ? orden : null;
}

/** Error al guardar: la clave que el back rechazó y su mensaje, para mostrarlo bajo ese campo. */
export interface ErrorGuardado {
  clave?: ClaveParametroOperativo;
  mensaje: string;
}

export type ResultadoGuardado = { ok: true; guardados: number } | { ok: false; error: ErrorGuardado };

interface GuardarParametros {
  actuales: Valores;
  nuevos: Valores;
  ventanaGeneral?: { inicio: string; fin: string };
  /** Un PUT /settings/:key por clave. */
  enviar: (clave: ClaveParametroOperativo, valor: string) => Promise<unknown>;
}

/** Mensaje para el coordinador cuando el back rechaza una clave. */
function mensajeError(error: unknown): string {
  const apiError = parseApiError(error);
  if (apiError.status === 403) return "Solo el coordinador puede modificar los parámetros operativos.";
  if (apiError.code === "INVALID_SETTING_VALUE") return `El servidor rechazó este valor: ${apiError.message}`;
  return "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";
}

/**
 * Envío del formulario (ST-57.1): manda al back solo lo que cambió, una clave por PUT y en el orden
 * de `planificarGuardado`. Si el back rechaza una clave se detiene ahí (lo anterior ya quedó guardado)
 * y devuelve esa clave para marcar el campo.
 */
export async function guardarParametros({ actuales, nuevos, ventanaGeneral, enviar }: GuardarParametros): Promise<ResultadoGuardado> {
  const cambios = planificarGuardado(actuales, nuevos, ventanaGeneral);
  if (cambios === null) {
    return { ok: false, error: { mensaje: "Revisa los campos marcados: hay valores que no cumplen las reglas." } };
  }
  for (const { clave, valor } of cambios) {
    try {
      await enviar(clave, valor);
    } catch (error) {
      return { ok: false, error: { clave, mensaje: mensajeError(error) } };
    }
  }
  return { ok: true, guardados: cambios.length };
}

/** Texto del toast tras un guardado exitoso. */
export function mensajeGuardado(guardados: number): string {
  if (guardados === 0) return "No hay cambios para guardar.";
  return guardados === 1 ? "Parámetro guardado." : `${guardados} parámetros guardados.`;
}
