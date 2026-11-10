import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

import { MapView } from "@/shared/components/common/map-view";
import type { PosicionFlotaEnVivo } from "../types/flota-posiciones.types";
import { esUbicacionSinSenal } from "../types/flota-posiciones.types";

const CENTRO_REFERENCIA: [number, number] = [-17.783, -63.182];

function fechaVisible(fecha: string | null): string {
  if (!fecha) return "Sin reporte GPS";
  const date = new Date(fecha);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("es-BO", { dateStyle: "short", timeStyle: "short" }).format(date) : "Hora no disponible";
}

function horaVisible(fecha: string | null): string {
  if (!fecha || !Number.isFinite(Date.parse(fecha))) return "hora desconocida";
  return new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", hour: "2-digit", minute: "2-digit" }).format(new Date(fecha));
}

function AjustarVistaInicial({
  puntos,
  rutaSeleccionada,
}: {
  puntos: PosicionFlotaEnVivo[];
  rutaSeleccionada: number | null;
}) {
  const map = useMap();
  const ajustado = useRef(false);

  useEffect(() => {
    const seleccionada = puntos.find((punto) => punto.routeBatchId === rutaSeleccionada && punto.lastLatitude !== null && punto.lastLongitude !== null);
    if (seleccionada) {
      map.setView([seleccionada.lastLatitude!, seleccionada.lastLongitude!], 15, { animate: true });
      return;
    }
    const ubicaciones = puntos.filter((punto) => punto.lastLatitude !== null && punto.lastLongitude !== null);
    if (!ajustado.current && ubicaciones.length) {
      if (ubicaciones.length === 1) map.setView([ubicaciones[0].lastLatitude!, ubicaciones[0].lastLongitude!], 13);
      else {
        const bounds: LatLngBoundsExpression = ubicaciones.map((punto) => [punto.lastLatitude!, punto.lastLongitude!]);
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
      }
      ajustado.current = true;
    }
  }, [map, puntos, rutaSeleccionada]);

  return null;
}

export function MapaPosicionesFlota({
  posiciones,
  umbralMinutos,
  rutaSeleccionada,
  ahora,
  onReasignar,
}: {
  posiciones: PosicionFlotaEnVivo[];
  umbralMinutos: number;
  rutaSeleccionada: number | null;
  ahora: number;
  onReasignar?: (routeBatchId: number) => void;
}) {
  const centro = useMemo<LatLngExpression>(() => {
    const punto = posiciones.find((posicion) => posicion.lastLatitude !== null && posicion.lastLongitude !== null);
    return punto ? [punto.lastLatitude!, punto.lastLongitude!] : CENTRO_REFERENCIA;
  }, [posiciones]);

  return (
    <MapView center={centro} zoom={posiciones.some((p) => p.lastLatitude !== null) ? 12 : 10} scrollWheelZoom className="h-[min(68vh,640px)] min-h-[360px] w-full rounded-lg">
      <AjustarVistaInicial puntos={posiciones} rutaSeleccionada={rutaSeleccionada} />
      {posiciones.map((posicion) => {
        if (posicion.lastLatitude === null || posicion.lastLongitude === null) return null;
        const sinSenal = esUbicacionSinSenal(posicion, umbralMinutos, ahora);
        const color = sinSenal
          ? "var(--map-marker-muted)"
          : posicion.routeBatchId === rutaSeleccionada
            ? "var(--map-marker-selected)"
            : "var(--map-marker-active)";
        return (
          <CircleMarker
            key={posicion.routeBatchId}
            center={[posicion.lastLatitude, posicion.lastLongitude]}
            radius={10}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.88, weight: 3 }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{posicion.vehiclePlate}</p>
                <p>Repartidor: {posicion.driverFullName}</p>
                <p>Parada: {posicion.currentStop?.trackingCode ?? "Sin parada abierta"}</p>
                <p>Estado: {posicion.currentStop?.status === "in_transit" ? "En movimiento" : "En ruta"}</p>
                <p>Última ubicación: {fechaVisible(posicion.lastLocationAt)}</p>
                {sinSenal && <p className="font-medium text-zinc-500">Sin señal desde {horaVisible(posicion.lastLocationAt)}</p>}
                {onReasignar && <button type="button" className="mt-2 rounded-md bg-primary px-3 py-1.5 text-primary-foreground" onClick={(event) => { event.stopPropagation(); onReasignar(posicion.routeBatchId); }}>Reasignar paradas</button>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapView>
  );
}
