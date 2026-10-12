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
