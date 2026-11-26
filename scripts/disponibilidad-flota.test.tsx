// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
const { DisponibilidadFlotaPanel } = await import("@/domains/reportes");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/reportes/reportes.disponibilidad");

const BASE = {
  cutoff: { date: "2026-11-25", kind: "current" }, from: "2026-11-01", to: "2026-11-25", units: { time: "calendar_days", load: ["kg", "m3"] }, n: 2,
  availability: { assignable: 7, registered: 9, inMaintenance: 1, outOfService: 1, unavailableReason: null },
  maintenance: { count: 3, calendarDays: 4, overlapsDetected: true },
  vehicles: [
    { vehicleId: 2, plate: "2345-ABC", fleetStatus: "active", maintenance: { count: 1, calendarDays: 2, overlapsDetected: false },
      load: { kg: { used: 820, capacity: 1000, ratio: 0.82 }, m3: { used: 5.5, capacity: 5, ratio: 1.1 }, routes: 4, n: 31, withoutWeight: 2, withoutVolume: 0, unavailableReason: null } },
    { vehicleId: 3, plate: "9876-XYZ", fleetStatus: "maintenance", maintenance: { count: 2, calendarDays: 2, overlapsDetected: true },
      load: { kg: null, m3: null, routes: 0, n: 0, withoutWeight: 0, withoutVolume: 0, unavailableReason: "no_route_in_period" } },
  ],
  productivity: { detailRestricted: false, deliveredCount: 40, attemptCount: 50, drivers: [{ driverId: 9, driverName: "Juan Rojas", deliveredCount: 18, attemptCount: 20 }] },
};
const PASADO = {
  ...BASE, cutoff: { date: "2026-11-01", kind: "past" },
  availability: { assignable: null, registered: null, inMaintenance: null, outOfService: null, unavailableReason: "no_status_history" },
  vehicles: BASE.vehicles.map((v) => ({ ...v, fleetStatus: null })),
};
const RESTRINGIDO = { ...BASE, productivity: { ...BASE.productivity, detailRestricted: true, drivers: [] } };

let respuesta: unknown;
let get: ReturnType<typeof vi.fn>;
const pedidos = () => get.mock.calls.map(([, c]) => c.params);

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  respuesta = BASE;
  get = vi.fn(async () => ({ data: respuesta }));
  vi.spyOn(api, "get").mockImplementation(get as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Ubicacion() {
  return <output data-testid="ubicacion">{useLocation().search}</output>;
}
function abrir({ ruta = "/app/reportes?vista=flota", supervisor = true } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <DisponibilidadFlotaPanel desde="2026-11-01" hasta="2026-11-25" puedeVerConductor={supervisor}
          vehiculos={[{ id: 2, nombre: "2345-ABC" }, { id: 3, nombre: "9876-XYZ" }]} repartidores={[{ id: 9, nombre: "Juan Rojas" }]} />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("reglas de disponibilidad (ST-303.2)", () => {
  it("el conductor solo se manda si el rol puede verlo; mantenimiento como routine", () => {
    const f = reglas.leerFiltrosDisponibilidad(new URLSearchParams("corte=2026-11-20&vehiculo=2&conductor=9&estadoFlota=maintenance&mantenimiento=rutina"));
    expect(reglas.paramsDisponibilidad(f, "2026-11-01", "2026-11-20", true)).toEqual({
      cutoff: "2026-11-20", from: "2026-11-01", to: "2026-11-20", vehicleId: 2, driverId: 9, fleetStatus: "maintenance", routine: true,
    });
    expect(reglas.paramsDisponibilidad(f, "2026-11-01", "2026-11-20", false)).not.toHaveProperty("driverId");
    expect(reglas.leerFiltrosDisponibilidad(new URLSearchParams())).toMatchObject({ corte: "2026-11-25", vehiculo: null });
  });

  it("N/D en vez de cero; la carga sin estimado es una cota inferior", () => {
    expect(reglas.textoDisponibilidad(null, null)).toBe("N/D");
    expect(reglas.textoDisponibilidad(0, 0)).toBe("N/D");
    expect(reglas.textoDisponibilidad(7, 9)).toBe("7 de 9 (78 %)");
    expect(reglas.textoCarga({ used: 820, capacity: 1000, ratio: 0.82 }, "kg", 2)).toBe("≥ 820 / 1.000 kg (82 %)");
    expect(reglas.textoCarga(null, "kg", 0)).toBe("N/D");
    expect(reglas.tasaEntrega(0, 0)).toBe("N/D");
  });
});

describe("Dashboard 3 de flota (ST-303.2)", () => {
  it("muestra disponibilidad puntual con n, días calendario, carga kg y m³ aparte y repartidores", async () => {
    abrir();
    expect(await screen.findByText("7 de 9 (78 %)")).toBeTruthy();
    expect(screen.getByText(/puntual/)).toBeTruthy();
    expect(screen.getByText(/se cruzan en un mismo vehículo/)).toBeTruthy();
    const vehiculos = within(screen.getByRole("table", { name: "Disponibilidad y carga por vehículo" }));
    expect(vehiculos.getByText("≥ 820 / 1.000 kg (82 %)")).toBeTruthy();
    expect(vehiculos.getByText("5,5 / 5 m³ (110 %)")).toBeTruthy();
    expect(vehiculos.getAllByText("N/D").length).toBe(2);
    expect(vehiculos.getByText(/no tuvo rutas aprobadas/)).toBeTruthy();
    expect(within(screen.getByRole("table", { name: "Entregas e intentos por repartidor" })).getByText("90 %")).toBeTruthy();
  });

  it("un corte pasado muestra N/D con su motivo, nunca cero", async () => {
    respuesta = PASADO;
    abrir({ ruta: "/app/reportes?corte=2026-11-01" });
    expect(await screen.findByText(/Solo se guarda el estado actual/)).toBeTruthy();
    expect(screen.getAllByText("N/D").length).toBeGreaterThanOrEqual(3);
    expect(pedidos()[0]).toMatchObject({ cutoff: "2026-11-01" });
  });

  it("sin permiso de detalle no hay filtro de conductor ni filas nominales", async () => {
    respuesta = RESTRINGIDO;
    abrir({ ruta: "/app/reportes?conductor=9", supervisor: false });
    expect(await screen.findByText(/Tu rol solo ve cifras agregadas/)).toBeTruthy();
    expect(screen.queryByLabelText("Conductor")).toBeNull();
    expect(screen.queryByText("Juan Rojas")).toBeNull();
    expect(pedidos()[0]).not.toHaveProperty("driverId");
  });

  it("los filtros van a la URL y vuelven a consultar con el mismo período", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByText("7 de 9 (78 %)");
    await user.selectOptions(screen.getByLabelText("Vehículo"), "2");
    await user.selectOptions(screen.getByLabelText("Mantenimiento"), "incidente");
    await user.selectOptions(screen.getByLabelText("Conductor"), "9");
    await waitFor(() => expect(pedidos().at(-1)).toEqual({ cutoff: "2026-11-25", from: "2026-11-01", to: "2026-11-25", vehicleId: 2, driverId: 9, routine: false }));
    expect(screen.getByTestId("ubicacion").textContent).toContain("vehiculo=2");
  });

  it("el 403 por filtro de conductor se explica", async () => {
    get.mockImplementation(async () => {
      const config = { url: "/fleet/availability", headers: new AxiosHeaders() };
      throw new AxiosError("x", "ERR_BAD_REQUEST", config, {}, { status: 403, statusText: "", data: { statusCode: 403, error: "DRIVER_DETAIL_FORBIDDEN", message: "x" }, headers: {}, config });
    });
    abrir();
    expect(await screen.findByText(/solo ve cifras agregadas de los repartidores/)).toBeTruthy();
  });
});
