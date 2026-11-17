import { CircleMarker } from "react-leaflet";

import { MapView } from "@/shared/components/common/map-view";
import type { UbicacionRepartidor } from "../types/seguimiento.types";

/**
 * Mapa chico con la última posición del repartidor. Un círculo en vez del marcador de Leaflet:
 * no depende de las imágenes del ícono, que Vite no resuelve solo. Se carga aparte (lazy) desde la tarjeta.
 */
export default function MiniMapa({ ubicacion }: { ubicacion: UbicacionRepartidor }) {
  const centro: [number, number] = [ubicacion.latitude, ubicacion.longitude];
  return (
    <MapView
      key={`${ubicacion.latitude},${ubicacion.longitude}`}
      center={centro}
      zoom={15}
      scrollWheelZoom={false}
      className="h-56 w-full rounded-lg border"
    >
      <CircleMarker center={centro} radius={9} pathOptions={{ color: "var(--map-marker-outline)", fillColor: "var(--map-marker-fill)", fillOpacity: 0.9, weight: 3 }} />
    </MapView>
  );
}
