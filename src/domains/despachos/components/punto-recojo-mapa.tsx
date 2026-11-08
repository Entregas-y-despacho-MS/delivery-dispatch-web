import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

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
    <MapContainer center={punto ?? CENTRO_INICIAL} zoom={punto ? 16 : 13} scrollWheelZoom className="h-56 w-full cursor-crosshair rounded-lg border">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AlHacerClic onElegir={onElegir} />
      {punto && <CircleMarker center={punto} radius={9} pathOptions={{ color: "#265c7f", fillColor: "#e18641", fillOpacity: 0.9, weight: 3 }} />}
    </MapContainer>
  );
}
