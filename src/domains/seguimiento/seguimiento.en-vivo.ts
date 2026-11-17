import { formatearHora } from "./seguimiento.format";
import type { EtaSeguimiento, RepartidorSeguimiento, SeguimientoPublico } from "./types/seguimiento.types";

/** Estados en los que el back manda ETA y repartidor (ST-40.1). */
const EN_CAMINO = new Set(["out_for_delivery", "in_transit"]);

export const estaEnCamino = (estado: string | undefined) => estado !== undefined && EN_CAMINO.has(estado);

/** Cada cuánto se recarga el seguimiento mientras el pedido va en camino (ST-40.2). */
export const REFRESCO_EN_VIVO_MS = 30_000;

/** Para TanStack Query: 30 s mientras va en camino; al entregarse (o antes de salir) no se recarga solo. */
export const intervaloRefresco = (pedido: Pick<SeguimientoPublico, "status"> | undefined) =>
  estaEnCamino(pedido?.status) ? REFRESCO_EN_VIVO_MS : false;

/** 12 → «12 min»; 65 → «1 h 5 min»; 120 → «2 h». */
export function formatearDuracion(minutos: number): string {
  const total = Math.max(0, Math.ceil(minutos));
  if (total < 60) return `${total} min`;
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/**
 * La llegada en palabras del cliente. Con `osrm` hay un cálculo real por ruta y se dan los minutos. Con `window`
 * el back no sabe dónde está el repartidor: no se inventa una cifra, se promete la franja que ya se le dio.
 */
export function textoEta(eta: EtaSeguimiento, finFranja: string | null): string {
  if (eta.source === "window") {
    return finFranja ? `Llega dentro de tu horario, antes de las ${formatearHora(finFranja)}` : "Llega dentro de tu horario";
  }
  if (eta.minutes <= 1) return "Está por llegar";
  return `Llega en unos ${formatearDuracion(eta.minutes)}`;
}

/** Explica de dónde sale la estimación, para que el cliente sepa cuánto confiar en ella. */
export const detalleEta = (eta: EtaSeguimiento) =>
  eta.source === "osrm"
    ? `Calculado por la ruta del repartidor a las ${formatearHora(eta.calculatedAt)}`
    : "Todavía no tenemos la ubicación del repartidor";

/** «moto» → «Moto»; sin tipo, «Vehículo». */
export function etiquetaVehiculo(repartidor: Pick<RepartidorSeguimiento, "vehicleType">): string {
  const tipo = repartidor.vehicleType?.trim();
  return tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "Vehículo";
}

/** «Moto · 2345-ABC»; null si la ruta no tiene vehículo. */
export function descripcionVehiculo(repartidor: RepartidorSeguimiento): string | null {
  if (!repartidor.vehicleType && !repartidor.vehiclePlate) return null;
  return [etiquetaVehiculo(repartidor), repartidor.vehiclePlate].filter(Boolean).join(" · ");
}
