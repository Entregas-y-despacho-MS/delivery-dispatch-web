import api from "@/shared/lib/axios";
import type { UmbralesAlerta, UmbralesAlertaGuardados } from "../types/configuracion.types";

const RUTA = "/settings/alert-thresholds";

/** Umbrales actuales (ST-67.1). Los pueden leer el supervisor y el coordinador. */
export async function obtenerUmbrales(signal?: AbortSignal): Promise<UmbralesAlertaGuardados> {
  const { data } = await api.get<UmbralesAlertaGuardados>(RUTA, { signal, skipErrorToast: true });
  return data;
}

/**
 * Guarda los tres umbrales juntos: el back los valida y guarda todos o ninguno. Solo el supervisor.
 * Se arma el cuerpo campo por campo para no mandar nada extra (como `updatedAt`).
 */
export async function guardarUmbrales(valores: UmbralesAlerta): Promise<UmbralesAlertaGuardados> {
  const cuerpo: UmbralesAlerta = {
    slaAlertMinOnTimePct: valores.slaAlertMinOnTimePct,
    gpsStaleAlertMinutes: valores.gpsStaleAlertMinutes,
    driverIncidentAlertPerDay: valores.driverIncidentAlertPerDay,
  };
  const { data } = await api.put<UmbralesAlertaGuardados>(RUTA, cuerpo, { skipErrorToast: true });
  return data;
}
