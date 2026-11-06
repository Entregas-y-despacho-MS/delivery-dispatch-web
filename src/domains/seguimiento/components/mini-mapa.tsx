import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";

import type { UbicacionRepartidor } from "../seguimiento.types";

/**
 * Mapa chico con la última posición del repartidor. Un círculo en vez del marcador de Leaflet:
 * no depende de las imágenes del ícono, que Vite no resuelve solo. Se carga aparte (lazy) desde la tarjeta.
 */
export default function MiniMapa({ ubicacion }: { ubicacion: UbicacionRepartidor }) {
  const centro: [number, number] = [ubicacion.latitude, ubicacion.longitude];
  return (
    <MapContainer
      key={`${ubicacion.latitude},${ubicacion.longitude}`}
      center={centro}
      zoom={15}
      scrollWheelZoom={false}
      className="h-56 w-full rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={centro} radius={9} pathOptions={{ color: "#265c7f", fillColor: "#e18641", fillOpacity: 0.9, weight: 3 }} />
    </MapContainer>
  );
}
