import { useEffect, useRef, useState } from "react";
import { Polygon, Polyline, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { LoaderCircle, MapPin, PenLine, Search, Trash2 } from "lucide-react";

import { MapView } from "@/shared/components/common/map-view";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { buscarContornosEnLaPaz, type ContornoResultado } from "../services/buscar-contorno-zona.service";
import type { PolygonBoundary } from "../types/catalogos.types";

const LA_PAZ_CENTER: LatLngExpression = [-16.5, -68.15];

export function ZonaCoberturaEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: PolygonBoundary | null;
  onChange: (value: PolygonBoundary | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContornoResultado[]>([]);
  const [selected, setSelected] = useState<ContornoResultado | null>(null);
  const [busy, setBusy] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [stroke, setStroke] = useState<PolygonBoundary>([]);
  const [error, setError] = useState("");

  const submitSearch = async () => {
    if (busy || query.trim().length < 3) return;
    setBusy(true);
    setError("");
    setResults([]);
    setSelected(null);
    try {
      const found = await buscarContornosEnLaPaz(query);
      setResults(found);
      if (found.length === 0) setError("No encontramos ese lugar dentro de La Paz. Prueba con un nombre más específico.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falló la búsqueda del lugar.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (result: ContornoResultado) => {
    setSelected(result);
    setDrawing(false);
    setStroke([]);
    setError("");
  };

  const useSuggestion = () => {
    if (!selected?.contorno) return;
    onChange(selected.contorno);
    setSelected(null);
    setDrawing(false);
    setError("");
  };

  const startDrawing = () => {
    setSelected(null);
    setStroke([]);
    setError("");
    setDrawing(true);
  };

  const completeDrawing = (boundary: PolygonBoundary) => {
    if (!validBoundary(boundary)) {
      setStroke([]);
      setError("Traza un perímetro cerrado con al menos tres puntos que formen un área.");
      return;
    }
    onChange(boundary);
    setStroke([]);
    setDrawing(false);
  };

  return (
    <section className="space-y-3" aria-labelledby="zona-coverage-heading">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="zona-coverage-heading" className="font-semibold">Cobertura de reparto</h3>
          <p className="text-sm text-muted-foreground">
            Busca un lugar de La Paz o traza el perímetro real de entrega sobre el mapa.
          </p>
        </div>
        {value?.length ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <MapPin className="size-4" aria-hidden /> Cobertura definida
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
            <MapPin className="size-4" aria-hidden /> Sin cobertura
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row" role="search">
        <label className="sr-only" htmlFor="zona-lugar-search">Buscar barrio o lugar en La Paz</label>
        <Input
          id="zona-lugar-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej.: Achumani"
          autoComplete="off"
          maxLength={100}
          disabled={disabled || busy}
          className="h-10"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submitSearch();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => void submitSearch()} disabled={disabled || busy || query.trim().length < 3}>
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
          Buscar en La Paz
        </Button>
      </div>
      {query.trim().length < 3 && (
        <p className="text-xs text-muted-foreground">Escribe al menos 3 letras para activar la búsqueda.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3" aria-label="Resultados de búsqueda">
          <p className="text-sm font-medium">Elige el lugar que coincide con tu zona</p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                disabled={disabled}
                aria-pressed={selected?.id === result.id}
                onClick={() => choose(result)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${selected?.id === result.id ? "border-primary bg-accent" : "bg-background"}`}
              >
                <span className="block font-medium">{result.nombre}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {result.contorno ? "Contorno encontrado · puedes revisarlo en el mapa" : result.detalleSinContorno}
                </span>
              </button>
            ))}
          </div>
          {selected && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              {selected.contorno ? (
                <Button type="button" onClick={useSuggestion} disabled={disabled}>
                  Usar este contorno
                </Button>
              ) : (
                <p className="text-sm text-amber-800">No apareció un límite listo. Puedes trazar tu cobertura en el mapa.</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-xl border bg-muted/10">
        <MapView center={LA_PAZ_CENTER} zoom={12} scrollWheelZoom className="h-[340px] w-full sm:h-[400px]">
          <MapBounds bounds={selected?.limites ?? null} center={selected?.centro ?? null} />
          {value && value.length >= 3 && <Polygon positions={toLatLngs(value)} pathOptions={{ color: "#176b8f", weight: 3, fillColor: "#2a91b8", fillOpacity: 0.24 }} />}
          {selected?.contorno && <Polygon positions={toLatLngs(selected.contorno)} pathOptions={{ color: "#d97706", weight: 3, dashArray: "7 5", fillColor: "#f59e0b", fillOpacity: 0.14 }} />}
          {stroke.length > 1 && <Polyline positions={toLatLngs(stroke)} pathOptions={{ color: "#c2410c", weight: 4, dashArray: "5 4" }} />}
          <FreehandDrawer enabled={drawing && !disabled} onStrokeChange={setStroke} onComplete={completeDrawing} />
        </MapView>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={drawing ? "default" : "outline"} onClick={startDrawing} disabled={disabled}>
          <PenLine className="size-4" aria-hidden />
          {drawing ? "Traza el perímetro y suelta" : value?.length ? "Redibujar mi cobertura" : "Trazar mi cobertura"}
        </Button>
        {value?.length ? (
          <Button type="button" variant="ghost" onClick={() => onChange(null)} disabled={disabled}>
            <Trash2 className="size-4" aria-hidden /> Quitar cobertura
          </Button>
        ) : null}
        {drawing && (
          <Button type="button" variant="ghost" onClick={() => { setDrawing(false); setStroke([]); }} disabled={disabled}>
            Cancelar trazo
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Mantén presionado y recorre el borde con mouse o dedo.</span>
      </div>

      {selected?.contorno && <p className="text-sm text-muted-foreground">El borde naranja es una sugerencia; el azul es el contorno guardado.</p>}
      {!value?.length && <p className="text-sm text-amber-800">Sin cobertura geográfica, los pedidos pueden quedar en revisión de dirección.</p>}
      <p className="text-xs text-muted-foreground">
        Búsqueda y mapa © <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.
      </p>
    </section>
  );
}

function FreehandDrawer({
  enabled,
  onStrokeChange,
  onComplete,
}: {
  enabled: boolean;
  onStrokeChange: (stroke: PolygonBoundary) => void;
  onComplete: (boundary: PolygonBoundary) => void;
}) {
  const map = useMap();
  const enabledRef = useRef(enabled);
  const pointsRef = useRef<[number, number][]>([]);
  const drawingRef = useRef(false);
  const callbacksRef = useRef({ onStrokeChange, onComplete });

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { callbacksRef.current = { onStrokeChange, onComplete }; }, [onStrokeChange, onComplete]);

  useEffect(() => {
    const container = map.getContainer();
    const point = (event: PointerEvent): [number, number] => {
      const rect = container.getBoundingClientRect();
      const latLng = map.containerPointToLatLng([event.clientX - rect.left, event.clientY - rect.top]);
      return [latLng.lng, latLng.lat];
    };
    const onDown = (event: PointerEvent) => {
      if (!enabledRef.current || event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest("a, button, .leaflet-control")) return;
      event.preventDefault();
      event.stopPropagation();
      drawingRef.current = true;
      pointsRef.current = [point(event)];
      map.dragging.disable();
      container.setPointerCapture?.(event.pointerId);
      callbacksRef.current.onStrokeChange(pointsRef.current);
    };
    const onMove = (event: PointerEvent) => {
      if (!drawingRef.current) return;
      const next = point(event);
      const previous = pointsRef.current[pointsRef.current.length - 1];
      const previousLayer = map.latLngToLayerPoint([previous[1], previous[0]]);
      const nextLayer = map.latLngToLayerPoint([next[1], next[0]]);
      if (previousLayer.distanceTo(nextLayer) < 6 || pointsRef.current.length >= 300) return;
      pointsRef.current = [...pointsRef.current, next];
      callbacksRef.current.onStrokeChange(pointsRef.current);
    };
    const onUp = (event: PointerEvent) => {
      if (!drawingRef.current) return;
      const next = point(event);
      const last = pointsRef.current[pointsRef.current.length - 1];
      if (!last || last[0] !== next[0] || last[1] !== next[1]) pointsRef.current = [...pointsRef.current, next];
      drawingRef.current = false;
      map.dragging.enable();
      callbacksRef.current.onStrokeChange(pointsRef.current);
      callbacksRef.current.onComplete(pointsRef.current);
      pointsRef.current = [];
    };
    const cancel = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      pointsRef.current = [];
      map.dragging.enable();
      callbacksRef.current.onStrokeChange([]);
    };

    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", cancel);
    return () => {
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", cancel);
      map.dragging.enable();
    };
  }, [map]);

  useEffect(() => {
    map.getContainer().style.cursor = enabled ? "crosshair" : "grab";
    map.getContainer().style.touchAction = enabled ? "none" : "pan-x pan-y";
    if (!enabled) map.dragging.enable();
    return () => {
      map.getContainer().style.cursor = "";
      map.getContainer().style.touchAction = "";
    };
  }, [enabled, map]);

  return null;
}

function MapBounds({
  bounds,
  center,
}: {
  bounds: [number, number, number, number] | null;
  center: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds([[bounds[1], bounds[0]], [bounds[3], bounds[2]]], { padding: [20, 20], maxZoom: 15 });
    } else if (center) {
      map.setView([center[1], center[0]], 14);
    }
  }, [bounds, center, map]);
  return null;
}

function toLatLngs(boundary: PolygonBoundary): LatLngExpression[] {
  return boundary.map(([longitude, latitude]) => [latitude, longitude] as LatLngExpression);
}

function validBoundary(boundary: PolygonBoundary): boolean {
  if (boundary.length < 3) return false;
  const unique = new Set(boundary.map(([longitude, latitude]) => `${longitude.toFixed(6)},${latitude.toFixed(6)}`));
  if (unique.size < 3) return false;
  let area = 0;
  for (let index = 0; index < boundary.length; index++) {
    const [longitude, latitude] = boundary[index];
    const [nextLongitude, nextLatitude] = boundary[(index + 1) % boundary.length];
    area += longitude * nextLatitude - nextLongitude * latitude;
  }
  return Math.abs(area) > Number.EPSILON;
}
