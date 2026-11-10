export interface ParadaFlotaEnVivo {
  dispatchId: number;
  trackingCode: string | null;
  status: string;
}

/** Respuesta de GET /fleet/live-positions (ST-60.1). */
export interface PosicionFlotaEnVivo {
  routeBatchId: number;
  driverId: number;
  driverFullName: string;
  vehicleId: number;
  vehiclePlate: string;
  deliveryZone: { id: number; name: string } | null;
  currentStop: ParadaFlotaEnVivo | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocationAt: string | null;
}

/** Evento Socket.IO dispatch.location.updated, enriquecido por el listener de Svc. */
export interface UbicacionFlotaActualizada {
  dispatchId: number;
  latitude: number;
  longitude: number;
  recordedAt: string;
  driverId: number;
  vehicleId: number;
  routeBatchId: number;
}

export type FiltroEstadoFlota = "todos" | "en_movimiento" | "sin_senal";

export function esUbicacionSinSenal(
  posicion: Pick<PosicionFlotaEnVivo, "lastLocationAt">,
  umbralMinutos: number,
  ahora = Date.now(),
): boolean {
  if (!posicion.lastLocationAt) return true;
  const marca = new Date(posicion.lastLocationAt).getTime();
  if (!Number.isFinite(marca)) return true;
  return ahora - marca >= umbralMinutos * 60_000;
}

export function filtrarPosicionesFlota(
  posiciones: PosicionFlotaEnVivo[],
  zonaId: string,
  estado: FiltroEstadoFlota,
  umbralMinutos: number,
  ahora = Date.now(),
): PosicionFlotaEnVivo[] {
  return posiciones.filter((posicion) => {
    if (zonaId !== "todas" && String(posicion.deliveryZone?.id ?? "") !== zonaId) return false;
    if (estado === "sin_senal") return esUbicacionSinSenal(posicion, umbralMinutos, ahora);
    if (estado === "en_movimiento") {
      return posicion.currentStop?.status === "in_transit" && !esUbicacionSinSenal(posicion, umbralMinutos, ahora);
    }
    return true;
  });
}
