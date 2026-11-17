import type { PolygonBoundary } from "../types/catalogos.types";

const SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const MIN_SEARCH_INTERVAL_MS = 1_000;
const CACHE = new Map<string, ContornoResultado[]>();
let ultimaConsulta = 0;

type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] }
  | { type: "Point"; coordinates: [number, number] }
  | { type: string; coordinates?: unknown };

interface NominatimFeature {
  type: "Feature";
  id?: string | number;
  bbox?: [number, number, number, number];
  geometry: GeoJsonGeometry;
  properties: {
    place_id?: number;
    display_name?: string;
    address?: { country_code?: string; [key: string]: unknown };
  };
}

export interface ContornoResultado {
  id: string;
  nombre: string;
  limites: [number, number, number, number] | null;
  centro: [number, number] | null;
  contorno: PolygonBoundary | null;
  detalleSinContorno: string | null;
}

/** Busca una sola vez cuando el usuario pulsa el botón; no realiza autocompletado. */
export async function buscarContornosEnLaPaz(termino: string): Promise<ContornoResultado[]> {
  const limpio = termino.trim().replace(/\s+/g, " ");
  if (limpio.length < 3) return [];

  const clave = limpio.toLocaleLowerCase("es-BO");
  const anterior = CACHE.get(clave);
  if (anterior) return anterior;

  const espera = MIN_SEARCH_INTERVAL_MS - (Date.now() - ultimaConsulta);
  if (espera > 0) await new Promise((resolve) => window.setTimeout(resolve, espera));
  ultimaConsulta = Date.now();

  const url = new URL(SEARCH_URL);
  url.searchParams.set("format", "geojson");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "bo");
  // La caja es un filtro de búsqueda aproximado alrededor de La Paz; el nombre de la ciudad
  // también se incluye para desambiguar barrios con el mismo nombre en otros municipios.
  url.searchParams.set("viewbox", "-68.45,-16.25,-67.85,-16.75");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("q", `${limpio}, La Paz, Bolivia`);

  const response = await fetch(url, { headers: { Accept: "application/geo+json, application/json" } });
  if (!response.ok) throw new Error("No se pudo buscar el lugar en el mapa. Intenta de nuevo.");

  const collection = (await response.json()) as { features?: NominatimFeature[] };
  const resultados = (collection.features ?? [])
    .filter(esResultadoDeLaPaz)
    .map(convertirResultado);

  CACHE.set(clave, resultados);
  return resultados;
}

function esResultadoDeLaPaz(feature: NominatimFeature): boolean {
  const address = feature.properties.address;
  const texto = feature.properties.display_name ?? "";
  const codigoPais = address?.country_code?.toLowerCase();
  // `addressdetails` puede venir incompleto según el tipo de geometría; la búsqueda ya
  // está acotada a Bolivia y La Paz, y el nombre visible sirve como respaldo.
  return codigoPais !== undefined && codigoPais !== "bo"
    ? false
    : /la paz/i.test(texto) && /bolivia/i.test(texto);
}

function convertirResultado(feature: NominatimFeature): ContornoResultado {
  const geometry = feature.geometry;
  const bbox = feature.bbox ?? null;
  let contorno: PolygonBoundary | null = null;
  let detalleSinContorno: string | null = null;
  let centro: [number, number] | null = null;

  if (geometry.type === "Polygon") {
    const exterior = (geometry as { type: "Polygon"; coordinates: number[][][] }).coordinates[0];
    if (exterior?.length >= 4) {
      const ring = exterior.map(([longitud, latitud]) => [longitud, latitud] as [number, number]);
      const primera = ring[0];
      const ultima = ring[ring.length - 1];
      if (primera[0] === ultima[0] && primera[1] === ultima[1]) ring.pop();
      contorno = ring.length >= 3 ? ring : null;
    }
    if (!contorno) detalleSinContorno = "El mapa no devolvió un contorno utilizable para este lugar.";
  } else if (geometry.type === "MultiPolygon") {
    detalleSinContorno = "El lugar tiene varias áreas separadas y no se puede guardar como una sola zona.";
  } else {
    detalleSinContorno = "El mapa encontró el lugar, pero no su límite. Puedes trazar el área de reparto.";
    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
      centro = [geometry.coordinates[0], geometry.coordinates[1]];
    }
  }

  if (!centro && bbox) centro = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  return {
    id: String(feature.properties.place_id ?? feature.id ?? feature.properties.display_name),
    nombre: feature.properties.display_name ?? "Lugar de La Paz",
    limites: bbox,
    centro,
    contorno,
    detalleSinContorno,
  };
}
