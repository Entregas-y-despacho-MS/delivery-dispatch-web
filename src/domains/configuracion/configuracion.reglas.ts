import type { ClaveParametroOperativo } from "./types/configuracion.types";

/**
 * Reglas de los parámetros operativos, espejo de `setting-value.validator.ts` del back (ST-57.2).
 * Se validan en el front para bloquear el guardado y mostrar el error bajo cada campo;
 * el back vuelve a validar todo al recibir cada PUT.
 */
type Regla =
  | { tipo: "entero"; min: number; max: number; unidad: string }
  | { tipo: "hora" }
  | { tipo: "lista-horas" }
  | { tipo: "lista-dias" }
  | { tipo: "lista-fechas"; permiteVacio: boolean };

const MINUTOS_SEMANA = 7 * 24 * 60;

export const REGLAS_PARAMETROS: Record<ClaveParametroOperativo, Regla> = {
  morning_window_start: { tipo: "hora" },
  morning_window_end: { tipo: "hora" },
  afternoon_window_start: { tipo: "hora" },
  afternoon_window_end: { tipo: "hora" },
  slot_duration_minutes: { tipo: "entero", min: 1, max: 1440, unidad: "minutos" },
  service_min_operating_days: { tipo: "entero", min: 1, max: 7, unidad: "días" },
  service_max_operating_days: { tipo: "entero", min: 1, max: 7, unidad: "días" },
  promise_response_window_minutes: { tipo: "entero", min: 1, max: MINUTOS_SEMANA, unidad: "minutos" },
  plan_generation_times: { tipo: "lista-horas" },
  plan_horizon_days: { tipo: "entero", min: 1, max: 365, unidad: "días" },
  plan_working_days: { tipo: "lista-dias" },
  plan_non_working_dates: { tipo: "lista-fechas", permiteVacio: true },
  stop_service_minutes: { tipo: "entero", min: 1, max: 1440, unidad: "minutos" },
  planning_margin_pct: { tipo: "entero", min: 1, max: 100, unidad: "%" },
  route_cutoff_time: { tipo: "hora" },
  final_review_end_time: { tipo: "hora" },
  route_reminder_time: { tipo: "hora" },
  final_review_escalation_time: { tipo: "hora" },
  warehouse_prep_end_time: { tipo: "hora" },
  warehouse_prep_lead_minutes: { tipo: "entero", min: 1, max: 1440, unidad: "minutos" },
  max_reschedule_attempts: { tipo: "entero", min: 1, max: 100, unidad: "intentos" },
  reschedule_window_days: { tipo: "entero", min: 1, max: 365, unidad: "días" },
  reschedule_code_expiry_minutes: { tipo: "entero", min: 1, max: 1440, unidad: "minutos" },
  max_wait_time_min: { tipo: "entero", min: 1, max: 1440, unidad: "minutos" },
  max_delivery_attempts: { tipo: "entero", min: 1, max: 100, unidad: "intentos" },
};

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const ENTERO = /^\d+$/;
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** "08:30" → 510 minutos; null si no es una hora válida. */
export function aMinutos(valor: string): number | null {
  if (!HORA.test(valor)) return null;
  const [horas, minutos] = valor.split(":").map(Number);
  return horas * 60 + minutos;
}

function esFechaIso(valor: string): boolean {
  if (!FECHA_ISO.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function validarLista(valor: string, esValido: (item: string) => boolean, esperado: string): string | null {
  const items = valor.split(",").map((item) => item.trim());
  if (items.some((item) => item.length === 0 || !esValido(item))) return `Usa una lista separada por comas de ${esperado}.`;
  if (new Set(items).size !== items.length) return "No repitas valores en la lista.";
  return null;
}

/** Error de un solo campo, en español, o null si el valor es válido. */
export function validarParametro(clave: ClaveParametroOperativo, valor: string): string | null {
  const regla = REGLAS_PARAMETROS[clave];
  switch (regla.tipo) {
    case "hora":
      return aMinutos(valor) !== null ? null : "Usa una hora válida en formato HH:mm (ej. 08:00).";
    case "lista-horas":
      return validarLista(valor, (item) => aMinutos(item) !== null, "horas HH:mm (ej. 08:30, 13:30)");
    case "lista-dias":
      return validarLista(valor, (item) => /^[1-7]$/.test(item), "días del 1 (lunes) al 7 (domingo)");
    case "lista-fechas":
      if (regla.permiteVacio && valor === "") return null;
      return validarLista(valor, esFechaIso, "fechas AAAA-MM-DD");
    case "entero":
      if (!ENTERO.test(valor)) return `Ingresa un número entero de ${regla.unidad}.`;
      if (Number(valor) < regla.min) return `Debe ser al menos ${regla.min}.`;
      if (Number(valor) > regla.max) return `No puede superar ${regla.max}.`;
      return null;
  }
}

export interface ErrorCruzado {
  /** Campo bajo el que se muestra el error. */
  clave: ClaveParametroOperativo;
  mensaje: string;
}

/**
 * Reglas entre campos, las mismas del back:
 * - plazo mínimo ≤ plazo máximo;
 * - cada ventana con inicio < fin y dentro de la ventana general de reparto;
 * - dos cadenas de horas independientes (son días distintos):
 *   corte < fin de revisión < recordatorio (día anterior) y escalamiento < fin de preparación (día de salida).
 */
export function validarCruces(
  valores: Partial<Record<ClaveParametroOperativo, string>>,
  ventanaGeneral?: { inicio: string; fin: string },
): ErrorCruzado[] {
  const errores: ErrorCruzado[] = [];

  const minimo = Number(valores.service_min_operating_days);
  const maximo = Number(valores.service_max_operating_days);
  if (ENTERO.test(valores.service_min_operating_days ?? "") && ENTERO.test(valores.service_max_operating_days ?? "") && maximo < minimo) {
    errores.push({ clave: "service_max_operating_days", mensaje: "El plazo máximo no puede ser menor que el mínimo." });
  }

  const generalInicio = ventanaGeneral ? aMinutos(ventanaGeneral.inicio) : null;
  const generalFin = ventanaGeneral ? aMinutos(ventanaGeneral.fin) : null;
  const ventanas = [
    ["morning_window_start", "morning_window_end", "mañana"],
    ["afternoon_window_start", "afternoon_window_end", "tarde"],
  ] as const;
  for (const [claveInicio, claveFin, nombre] of ventanas) {
    const inicio = aMinutos(valores[claveInicio] ?? "");
    const fin = aMinutos(valores[claveFin] ?? "");
    if (inicio === null || fin === null) continue;
    if (inicio >= fin) {
      errores.push({ clave: claveFin, mensaje: `El fin de la ventana de ${nombre} debe ser posterior al inicio.` });
    } else if (generalInicio !== null && generalFin !== null && (inicio < generalInicio || fin > generalFin)) {
      errores.push({
        clave: inicio < generalInicio ? claveInicio : claveFin,
        mensaje: `La ventana de ${nombre} debe estar dentro del horario de reparto (${ventanaGeneral?.inicio}–${ventanaGeneral?.fin}).`,
      });
    }
  }

  const cadenas = [
    [["route_cutoff_time", "al corte de rutas"], ["final_review_end_time", "al fin de la revisión"], ["route_reminder_time", "al recordatorio"]],
    [["final_review_escalation_time", "al escalamiento"], ["warehouse_prep_end_time", "al fin de preparación de Almacén"]],
  ] as const;
  for (const cadena of cadenas) {
    const horas = cadena.map(([clave]) => aMinutos(valores[clave] ?? ""));
    if (horas.some((hora) => hora === null)) continue;
    const minutos = horas as number[];
    const rota = minutos.findIndex((hora, i) => i > 0 && minutos[i - 1] >= hora);
    if (rota > 0) errores.push({ clave: cadena[rota][0], mensaje: `Debe ser posterior ${cadena[rota - 1][1]}.` });
  }

  return errores;
}
