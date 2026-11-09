// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { handlers, fitBounds, setView, getPosiciones, getUmbrales } = vi.hoisted(() => ({
  handlers: new Map<string, (payload?: unknown) => void>(),
  fitBounds: vi.fn(),
  setView: vi.fn(),
  getPosiciones: vi.fn(),
  getUmbrales: vi.fn(),
}));

vi.mock("@/shared/lib/socket", () => ({
  crearSocketOperativo: () => ({
    on: (event: string, listener: (payload?: unknown) => void) => {
      handlers.set(event, listener);
      if (event === "connect") queueMicrotask(listener);
    },
    off: (event: string) => handlers.delete(event),
    disconnect: vi.fn(),
  }),
}));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="fleet-map">{children}</div>,
  TileLayer: () => null,
  CircleMarker: ({ children, pathOptions, center }: { children: ReactNode; pathOptions: { fillColor: string }; center: number[] }) => (
    <div data-testid="map-marker" data-color={pathOptions.fillColor} data-center={center.join(",")}>{children}</div>
  ),
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMap: () => ({ setView, fitBounds }),
}));
vi.mock("@/domains/flota/services/posiciones-flota.service", () => ({
  obtenerPosicionesFlota: (...args: unknown[]) => getPosiciones(...args),
}));
vi.mock("@/domains/configuracion/services/umbrales.service", () => ({
  obtenerUmbrales: (...args: unknown[]) => getUmbrales(...args),
  guardarUmbrales: vi.fn(),
}));

vi.stubEnv("VITE_API_URL", "http://localhost:3000/api");
vi.stubEnv("VITE_SOCKET_URL", "http://localhost:3000");

const NOW = Date.now();
const positions = [{
  routeBatchId: 10,
  driverId: 1,
  driverFullName: "Ana Repartidora",
  vehicleId: 5,
  vehiclePlate: "ABC-123",
  deliveryZone: { id: 2, name: "Centro" },
  currentStop: { dispatchId: 99, trackingCode: "DSP-099", status: "in_transit" },
  lastLatitude: -17.78,
  lastLongitude: -63.18,
  lastLocationAt: new Date(NOW - 10 * 60_000).toISOString(),
}];

function renderMap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MapaPrueba /></QueryClientProvider>);
}

let flota: typeof import("@/domains/flota");

function MapaPrueba() {
  const { posiciones, umbrales } = flota.usePosicionesFlota();
  if (posiciones.isPending || umbrales.umbrales.isPending) return <p>Cargando flota</p>;
  if (posiciones.isError || umbrales.umbrales.isError || !umbrales.umbrales.data) return <p>Error de flota</p>;
  const lista = posiciones.data ?? [];
  return (
    <>
      {lista.length === 0 && <p>No hay vehículos en rutas activas en este momento.</p>}
      <flota.MapaPosicionesFlota
        posiciones={lista}
        umbralMinutos={umbrales.umbrales.data.gpsStaleAlertMinutes}
        rutaSeleccionada={null}
        ahora={NOW}
      />
    </>
  );
}

beforeEach(async () => {
  handlers.clear();
  fitBounds.mockClear();
  setView.mockClear();
  getPosiciones.mockReset().mockResolvedValue(positions);
  getUmbrales.mockReset().mockResolvedValue({
    gpsStaleAlertMinutes: 5,
    slaAlertMinOnTimePct: 80,
    driverIncidentAlertPerDay: 3,
    updatedAt: new Date(NOW).toISOString(),
  });
  const { useAuthStore } = await import("@/shared/store/use-auth-store");
  useAuthStore.setState({ access_token: "supervisor-token" });
  flota = await import("@/domains/flota");
});

afterEach(async () => {
  cleanup();
  const { useAuthStore } = await import("@/shared/store/use-auth-store");
  useAuthStore.setState({ user: null, access_token: null, refresh_token: null });
});

describe("mapa en vivo de la flota (ST-60.3)", () => {
  it("carga posiciones, datos del conductor y centra los marcadores reportados", async () => {
    renderMap();

    expect(await screen.findByText("ABC-123")).toBeTruthy();
    expect(screen.getByText("Repartidor: Ana Repartidora")).toBeTruthy();
    expect(screen.getByText("Parada: DSP-099")).toBeTruthy();
    expect(screen.getByTestId("map-marker").getAttribute("data-center")).toBe("-17.78,-63.18");
    await waitFor(() => expect(setView).toHaveBeenCalledWith([-17.78, -63.18], 13));
    expect(screen.getByTestId("map-marker").getAttribute("data-color")).toBe("#71717a");
    expect(getPosiciones).toHaveBeenCalled();
    expect(getUmbrales).toHaveBeenCalledOnce();
  });

  it("actualiza el marcador al recibir dispatch.location.updated", async () => {
    renderMap();
    await screen.findByText("ABC-123");
    await waitFor(() => expect(handlers.has("dispatch.location.updated")).toBe(true));

    handlers.get("dispatch.location.updated")?.({
      dispatchId: 99,
      routeBatchId: 10,
      driverId: 1,
      vehicleId: 5,
      latitude: -17.7,
      longitude: -63.1,
      recordedAt: new Date().toISOString(),
    });

    await waitFor(() => expect(screen.getByTestId("map-marker").getAttribute("data-center")).toBe("-17.7,-63.1"));
  });

  it("presenta el estado vacío cuando el servicio no devuelve vehículos en ruta", async () => {
    getPosiciones.mockResolvedValue([]);
    renderMap();

    expect(await screen.findByText("No hay vehículos en rutas activas en este momento.")).toBeTruthy();
    expect(screen.queryByTestId("map-marker")).toBeNull();
  });
});
