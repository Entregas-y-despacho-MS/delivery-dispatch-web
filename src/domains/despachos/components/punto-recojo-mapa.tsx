import { CircleMarker, useMapEvents } from "react-leaflet";

import { MapView } from "@/shared/components/common/map-view";

/** Centro de La Paz, para cuando todavía no se marcó nada. */
const CENTRO_INICIAL: [number, number] = [-16.5, -68.13];

function AlHacerClic({ onElegir }: { onElegir: (latitud: number, longitud: number) => void }) {
  useMapEvents({ click: (evento) => onElegir(evento.latlng.lat, evento.latlng.lng) });
  return null;
}

interface PuntoRecojoMapaProps {
  latitud: number | null;
  longitud: number | null;
  onElegir: (latitud: number, longitud: number) => void;
}

/**
 * Mapa para marcar dónde se recoge (ST-81.1): un clic pone el punto. Un círculo en vez del marcador de
 * Leaflet, como en el mini mapa del seguimiento. Se carga aparte (lazy) desde el formulario.
 */
export default function PuntoRecojoMapa({ latitud, longitud, onElegir }: PuntoRecojoMapaProps) {
  const punto: [number, number] | null = latitud !== null && longitud !== null ? [latitud, longitud] : null;
  return (
    <MapView center={punto ?? CENTRO_INICIAL} zoom={punto ? 16 : 13} scrollWheelZoom className="h-56 w-full cursor-crosshair rounded-lg border">
      <AlHacerClic onElegir={onElegir} />
      {punto && <CircleMarker center={punto} radius={9} pathOptions={{ color: "var(--map-marker-outline)", fillColor: "var(--map-marker-fill)", fillOpacity: 0.9, weight: 3 }} />}
    </MapView>
  );
}
