// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const { handlers, setView, fitBounds, apiGet, umbralGet } = vi.hoisted(() => ({
  handlers: new Map<string, (payload?: unknown) => void>(),
  setView: vi.fn(),
  fitBounds: vi.fn(),
  apiGet: vi.fn(),
  umbralGet: vi.fn(),
}));

vi.mock("@/shared/lib/socket", () => ({
  crearSocketOperativo: () => ({
    on: (event: string, listener: (payload?: unknown) => void) => { handlers.set(event, listener); },
    off: (event: string) => { handlers.delete(event); },
    disconnect: vi.fn(),
  }),
}));

vi.mock("react-leaflet", async () => {
  return {
    MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="fleet-map">{children}</div>,
    TileLayer: () => null,
    CircleMarker: ({ children, pathOptions, center }: { children: ReactNode; pathOptions: { fillColor: string }; center: number[] }) => (
      <div data-testid="map-marker" data-color={pathOptions.fillColor} data-center={center.join(",")}>{children}</div>
    ),
    Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    useMap: () => ({ setView, fitBounds }),
  };
});

vi.mock("@/domains/flota/services/posiciones-flota.service", () => ({
  obtenerPosicionesFlota: (...args: unknown[]) => apiGet(...args),
}));
vi.mock("@/domains/configuracion/services/umbrales.service", () => ({
  obtenerUmbrales: (...args: unknown[]) => umbralGet(...args),
  guardarUmbrales: vi.fn(),
}));

vi.stubEnv("VITE_API_URL", "http://localhost:3000/api");
vi.stubEnv("VITE_SOCKET_URL", "http://localhost:3000");

const NOW = Date.now();
type FlotaModule = typeof import("@/domains/flota");
let flota: FlotaModule;
const datos = [
  {
    routeBatchId: 10, driverId: 1, driverFullName: "Ana Repartidora", vehicleId: 5, vehiclePlate: "ABC-123",
    deliveryZone: { id: 2, name: "Centro" }, currentStop: { dispatchId: 99, trackingCode: "DSP-099", status: "in_transit" },
    lastLatitude: -17.78, lastLongitude: -63.18, lastLocationAt: new Date(NOW - 60_000).toISOString(),
  },
  {
    routeBatchId: 11, driverId: 2, driverFullName: "Luis Chofer", vehicleId: 6, vehiclePlate: "XYZ-456",
    deliveryZone: { id: 3, name: "Norte" }, currentStop: { dispatchId: 100, trackingCode: "DSP-100", status: "assigned" },
    lastLatitude: -17.76, lastLongitude: -63.16, lastLocationAt: new Date(NOW - 20 * 60_000).toISOString(),
  },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MapaPrueba /></QueryClientProvider>);
}

function MapaPrueba() {
  const { posiciones, umbrales } = flota.usePosicionesFlota();
  const [zonaId, setZonaId] = useState("todas");
  const [estado, setEstado] = useState<"todos" | "en_movimiento" | "sin_senal">("todos");
  const [rutaSeleccionada, setRutaSeleccionada] = useState<number | null>(null);
  if (posiciones.isPending || umbrales.umbrales.isPending) return <p>Cargando flota</p>;
  if (posiciones.isError || umbrales.umbrales.isError || !umbrales.umbrales.data) return <p>Error de flota</p>;
  return (
    <>
      <flota.MapaPosicionesFlota posiciones={posiciones.data ?? []} umbralMinutos={umbrales.umbrales.data.gpsStaleAlertMinutes} rutaSeleccionada={rutaSeleccionada} ahora={NOW} />
      <flota.PanelVehiculosFlota
        posiciones={posiciones.data ?? []}
        umbralMinutos={umbrales.umbrales.data.gpsStaleAlertMinutes}
        ahora={NOW}
        zonaId={zonaId}
        estado={estado}
        rutaSeleccionada={rutaSeleccionada}
        onZonaChange={setZonaId}
        onEstadoChange={setEstado}
        onSeleccionar={setRutaSeleccionada}
      />
    </>
  );
}

beforeEach(async () => {
  handlers.clear();
  setView.mockClear();
  fitBounds.mockClear();
  apiGet.mockReset().mockResolvedValue(datos);
  umbralGet.mockReset().mockResolvedValue({ gpsStaleAlertMinutes: 5, slaAlertMinOnTimePct: 80, driverIncidentAlertPerDay: 3, updatedAt: new Date(NOW).toISOString() });
  const { useAuthStore } = await import("@/shared/store/use-auth-store");
  useAuthStore.setState({ access_token: "supervisor-token" });
  flota = await import("@/domains/flota");
});

afterEach(async () => {
  cleanup();
  const { useAuthStore } = await import("@/shared/store/use-auth-store");
  useAuthStore.setState({ user: null, access_token: null, refresh_token: null });
});

describe("mapa y panel de flota (ST-60.3 / ST-60.4)", () => {
  it("carga posiciones reales y muestra placa, conductor, parada y estado de señal", async () => {
    renderPage();

    expect((await screen.findAllByText("ABC-123")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ana Repartidora").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Parada: DSP-099/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("XYZ-456").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("map-marker")).toHaveLength(2);
    expect(screen.getAllByTestId("map-marker")[1]?.getAttribute("data-color")).toBe("#71717a");
    expect(fitBounds).toHaveBeenCalledOnce();
    expect(apiGet).toHaveBeenCalledOnce();
    expect(umbralGet).toHaveBeenCalledOnce();
  });

  it("aplica el evento dispatch.location.updated al marcador del lote correspondiente", async () => {
    renderPage();
    const marker = (await screen.findAllByTestId("map-marker"))[0];
    expect(marker?.getAttribute("data-center")).toBe("-17.78,-63.18");

    await waitFor(() => expect(handlers.has("dispatch.location.updated")).toBe(true));
    handlers.get("dispatch.location.updated")?.({
      dispatchId: 99, routeBatchId: 10, driverId: 1, vehicleId: 5,
      latitude: -17.7, longitude: -63.1, recordedAt: new Date().toISOString(),
    });

    await waitFor(() => expect(screen.getAllByTestId("map-marker")[0]?.getAttribute("data-center")).toBe("-17.7,-63.1"));
  });

  it("filtra por zona y estado, y al elegir un vehículo centra el mapa", async () => {
    renderPage();
    const list = await screen.findByRole("list", { name: "Lista de vehículos" });
    expect(within(list).getAllByRole("button")).toHaveLength(2);

    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por zona" }), { target: { value: "2" } });
    expect(within(list).getAllByRole("button")).toHaveLength(1);
    expect(within(list).getByRole("button", { name: /ABC-123/ })).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por zona" }), { target: { value: "todas" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por estado" }), { target: { value: "sin_senal" } });
    expect(within(list).getAllByRole("button")).toHaveLength(1);
    expect(within(list).getByRole("button", { name: /XYZ-456/ })).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por estado" }), { target: { value: "en_movimiento" } });
    const seleccionar = within(list).getByRole("button", { name: /ABC-123/ });
    fireEvent.click(seleccionar);
    await waitFor(() => expect(setView).toHaveBeenCalledWith([-17.78, -63.18], 15, { animate: true }));
    expect(seleccionar.getAttribute("aria-pressed")).toBe("true");
  });

  it("mantiene informativo un vehículo sin coordenadas y no ofrece centrarlo", async () => {
    apiGet.mockResolvedValueOnce([...datos, {
      routeBatchId: 12, driverId: 3, driverFullName: "Marta Chofer", vehicleId: 7, vehiclePlate: "NO-GPS",
      deliveryZone: { id: 4, name: "Sur" }, currentStop: { dispatchId: 101, trackingCode: "DSP-101", status: "in_transit" },
      lastLatitude: null, lastLongitude: null, lastLocationAt: null,
    }]);
    renderPage();
    const sinCoordenadas = await screen.findByRole("button", { name: /NO-GPS.*sin ubicación GPS.*no se puede centrar/i });

    expect(sinCoordenadas.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("No hay coordenadas GPS para centrar el mapa.")).toBeTruthy();
    setView.mockClear();
    fireEvent.click(sinCoordenadas);
    expect(setView).not.toHaveBeenCalled();
  });
});
