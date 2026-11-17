import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, type MapContainerProps } from "react-leaflet";

/** Contenedor común con la capa base de OpenStreetMap. Las capas y controles siguen siendo del mapa consumidor. */
export function MapView({ children, ...props }: MapContainerProps) {
  return (
    <MapContainer {...props}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
