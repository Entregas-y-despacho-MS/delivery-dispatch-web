import { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

import type { PosicionFlotaEnVivo } from "../flota-posiciones.types";
import { esUbicacionSinSenal } from "../flota-posiciones.types";

const CENTRO_REFERENCIA: [number, number] = [-17.783, -63.182];

function fechaVisible(fecha: string | null): string {
  if (!fecha) return "Sin reporte GPS";
  const date = new Date(fecha);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("es-BO", { dateStyle: "short", timeStyle: "short" }).format(date) : "Hora no disponible";
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
}: {
  posiciones: PosicionFlotaEnVivo[];
  umbralMinutos: number;
  rutaSeleccionada: number | null;
  ahora: number;
}) {
  const centro = useMemo<LatLngExpression>(() => {
    const punto = posiciones.find((posicion) => posicion.lastLatitude !== null && posicion.lastLongitude !== null);
    return punto ? [punto.lastLatitude!, punto.lastLongitude!] : CENTRO_REFERENCIA;
  }, [posiciones]);

  return (
    <MapContainer center={centro} zoom={posiciones.some((p) => p.lastLatitude !== null) ? 12 : 10} scrollWheelZoom className="h-[min(68vh,640px)] min-h-[360px] w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarVistaInicial puntos={posiciones} rutaSeleccionada={rutaSeleccionada} />
      {posiciones.map((posicion) => {
        if (posicion.lastLatitude === null || posicion.lastLongitude === null) return null;
        const sinSenal = esUbicacionSinSenal(posicion, umbralMinutos, ahora);
        const color = sinSenal ? "#71717a" : posicion.routeBatchId === rutaSeleccionada ? "#f97316" : "#0f766e";
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
                {sinSenal && <p className="font-medium text-zinc-500">Sin señal GPS</p>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
