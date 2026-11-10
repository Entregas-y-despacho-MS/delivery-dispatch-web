import { parseApiError } from "@/shared/lib/api-error";
import type { CampoUmbral } from "./types/configuracion.types";

export const CAMPOS_UMBRAL: readonly CampoUmbral[] = [
  "slaAlertMinOnTimePct",
  "gpsStaleAlertMinutes",
  "driverIncidentAlertPerDay",
];

/** Rangos que acepta el back (UpdateAlertThresholdsDto). Siempre números enteros. */
export const RANGOS_UMBRAL: Record<CampoUmbral, { min: number; max: number }> = {
  slaAlertMinOnTimePct: { min: 0, max: 100 },
  gpsStaleAlertMinutes: { min: 1, max: 1440 },
  driverIncidentAlertPerDay: { min: 1, max: 100 },
};

/** Nombre de cada umbral en la tabla de parámetros del back (aparece en los mensajes de error). */
const CLAVE_BACK: Record<CampoUmbral, string> = {
  slaAlertMinOnTimePct: "sla_alert_min_on_time_pct",
  gpsStaleAlertMinutes: "gps_stale_alert_minutes",
  driverIncidentAlertPerDay: "driver_incident_alert_per_day",
};

export const MENSAJE_RANGO_UMBRAL: Record<CampoUmbral, string> = {
  slaAlertMinOnTimePct: "Ingresa un porcentaje entero entre 0 y 100.",
  gpsStaleAlertMinutes: "Ingresa un número entero de minutos entre 1 y 1440 (24 horas).",
  driverIncidentAlertPerDay: "Ingresa un número entero de incidencias entre 1 y 100.",
};

export interface ErrorUmbrales {
  /** Campo que rechazó el back, para mostrar el error bajo él; sin campo va arriba del formulario. */
  campo?: CampoUmbral;
  mensaje: string;
}

/**
 * Traduce el error del PUT. Se decide por `status` y `code`; el nombre del campo solo se busca en el
 * texto para saber bajo qué campo mostrar el error de validación.
 */
export function errorGuardadoUmbrales(error: unknown): ErrorUmbrales {
  const apiError = parseApiError(error);
  if (apiError.status === 403) return { mensaje: "Solo el supervisor puede cambiar los umbrales de alerta." };
  if (apiError.code === "SETTING_NOT_FOUND") {
    return { mensaje: "Los umbrales todavía no están configurados en el servidor. Avísale al administrador." };
  }
  if (apiError.code === "INVALID_SETTING_VALUE" || apiError.kind === "validation") {
    const texto = [apiError.message, ...apiError.validationMessages].join(" ");
    const campo = CAMPOS_UMBRAL.find((c) => texto.includes(c) || texto.includes(CLAVE_BACK[c]));
    if (campo) return { campo, mensaje: MENSAJE_RANGO_UMBRAL[campo] };
    // parseApiError ya arma el texto («El servidor rechazó los datos. …»).
    return { mensaje: apiError.message };
  }
  return { mensaje: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
}
