// @vitest-environment jsdom
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SeguimientoPublico } from "@/domains/seguimiento";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
// Leaflet necesita medir el DOM y descargar mosaicos: en las pruebas el mapa se reemplaza por su posición.
vi.mock("@/domains/seguimiento/components/mini-mapa", () => ({
  default: ({ ubicacion }: { ubicacion: { latitude: number; longitude: number } }) => (
    <div role="img" aria-label={`Mapa en ${ubicacion.latitude}, ${ubicacion.longitude}`} />
  ),
}));
const { publicApi } = await import("@/shared/lib/public-api");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/seguimiento/seguimiento.en-vivo");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el componente directamente.
const { EnCaminoCard } = await import("@/domains/seguimiento/components/en-camino-card");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el hook directamente.
const { useSeguimientoPublico } = await import("@/domains/seguimiento/hooks/use-seguimiento-publico");

// 10:00 a 12:00 en Bolivia (UTC-4).
const BASE: SeguimientoPublico = {
  trackingCode: "DSP-2026-00045", status: "scheduled", customerConfirmation: "confirmed", deliveryDate: "2026-11-06",
  windowStart: "2026-11-06T14:00:00.000Z", windowEnd: "2026-11-06T16:00:00.000Z",
  eta: null, driver: null, location: null,
  selfService: { open: false, closedReason: "confirmed", windowClosesAt: null, rescheduleAttemptsLeft: 0, canConfirm: false, canReschedule: false, canRequestChange: false },
};
const REPARTIDOR = { name: "Juan Rojas", vehicleType: "moto", vehiclePlate: "2345-ABC" };
const SALIO: SeguimientoPublico = {
  ...BASE, status: "out_for_delivery",
  eta: { minutes: 42, calculatedAt: "2026-11-06T14:10:00.000Z", source: "osrm" },
  driver: REPARTIDOR,
};
const SU_TURNO: SeguimientoPublico = {
  ...SALIO, status: "in_transit",
  eta: { minutes: 12, calculatedAt: "2026-11-06T15:01:00.000Z", source: "osrm" },
  location: { latitude: -16.5, longitude: -68.13, recordedAt: "2026-11-06T15:00:30.000Z" },
};

afterEach(cleanup);

describe("reglas del seguimiento en vivo (ST-40.2)", () => {
  it("con OSRM da los minutos; muy cerca, «está por llegar»", () => {
    expect(reglas.textoEta({ minutes: 12, calculatedAt: "", source: "osrm" }, BASE.windowEnd)).toBe("Llega en unos 12 min");
    expect(reglas.textoEta({ minutes: 65, calculatedAt: "", source: "osrm" }, BASE.windowEnd)).toBe("Llega en unos 1 h 5 min");
    expect(reglas.textoEta({ minutes: 1, calculatedAt: "", source: "osrm" }, BASE.windowEnd)).toBe("Está por llegar");
  });

  it("con source: window no inventa minutos: promete la franja", () => {
    const eta = { minutes: 37, calculatedAt: "2026-11-06T15:23:00.000Z", source: "window" as const };
    expect(reglas.textoEta(eta, BASE.windowEnd)).toBe("Llega dentro de tu horario, antes de las 12:00");
    expect(reglas.textoEta(eta, null)).toBe("Llega dentro de tu horario");
    expect(reglas.detalleEta(eta)).toBe("Todavía no tenemos la ubicación del repartidor");
  });

  it("se recarga cada 30 s solo mientras va en camino", () => {
    expect(reglas.intervaloRefresco(SALIO)).toBe(30_000);
    expect(reglas.intervaloRefresco(SU_TURNO)).toBe(30_000);
    expect(reglas.intervaloRefresco({ status: "delivered" })).toBe(false);
    expect(reglas.intervaloRefresco(undefined)).toBe(false);
  });

  it("describe el vehículo y no inventa uno si la ruta no tiene", () => {
    expect(reglas.descripcionVehiculo(REPARTIDOR)).toBe("Moto · 2345-ABC");
    expect(reglas.descripcionVehiculo({ ...REPARTIDOR, vehicleType: null })).toBe("Vehículo · 2345-ABC");
    expect(reglas.descripcionVehiculo({ ...REPARTIDOR, vehicleType: null, vehiclePlate: null })).toBeNull();
  });
});

describe("tarjeta «Tu pedido está en camino» (ST-40.2)", () => {
  const tarjeta = () => screen.getByRole("region", { name: "Tu pedido está en camino" });

  it("antes de salir (scheduled) no ocupa lugar", () => {
    const { container } = render(<EnCaminoCard pedido={BASE} />);
    expect(container.innerHTML).toBe("");
  });

  it("ya entregado no ocupa lugar aunque quede algún dato", () => {
    const { container } = render(<EnCaminoCard pedido={{ ...SU_TURNO, status: "delivered" }} />);
    expect(container.innerHTML).toBe("");
  });

  it("out_for_delivery: ETA, repartidor y vehículo, sin mapa", () => {
    render(<EnCaminoCard pedido={SALIO} />);
    const t = within(tarjeta());
    expect(t.getByText("El repartidor salió con tu pedido y otras entregas.")).toBeTruthy();
    expect(t.getByText("Llega en unos 42 min")).toBeTruthy();
    expect(t.getByText("Calculado por la ruta del repartidor a las 10:10")).toBeTruthy();
    expect(t.getByText("Juan Rojas")).toBeTruthy();
    expect(t.getByText("Moto · 2345-ABC")).toBeTruthy();
    expect(t.queryByRole("img")).toBeNull();
  });

  it("in_transit con posición: es su turno y muestra el mini mapa con la hora de la ubicación", async () => {
    render(<EnCaminoCard pedido={SU_TURNO} />);
    const t = within(tarjeta());
    expect(t.getByText("El repartidor va hacia tu dirección.")).toBeTruthy();
    expect(t.getByText("Llega en unos 12 min")).toBeTruthy();
    expect(await t.findByRole("img", { name: "Mapa en -16.5, -68.13" })).toBeTruthy();
    expect(t.getByText("Ubicación del repartidor a las 11:00")).toBeTruthy();
  });

  it("in_transit sin posición todavía: sin mapa y con la ETA de la franja (source: window)", () => {
    render(<EnCaminoCard pedido={{ ...SU_TURNO, location: null, eta: { minutes: 50, calculatedAt: "2026-11-06T15:10:00.000Z", source: "window" } }} />);
    const t = within(tarjeta());
    expect(t.getByText("Llega dentro de tu horario, antes de las 12:00")).toBeTruthy();
    expect(t.getByText("Todavía no tenemos la ubicación del repartidor")).toBeTruthy();
    expect(t.queryByRole("img")).toBeNull();
  });

  it("si la ruta no tiene vehículo, muestra solo al repartidor", () => {
    render(<EnCaminoCard pedido={{ ...SALIO, driver: { name: "Ana Quispe", vehicleType: null, vehiclePlate: null } }} />);
    const t = within(tarjeta());
    expect(t.getByText("Ana Quispe")).toBeTruthy();
    expect(t.queryByText("Vehículo")).toBeNull();
  });

  it("sin ETA ni repartidor (ruta sin conductor) no muestra una tarjeta vacía", () => {
    const { container } = render(<EnCaminoCard pedido={{ ...SALIO, eta: null, driver: null }} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("refresco del seguimiento en vivo (ST-40.2)", () => {
  let respuesta: SeguimientoPublico;

  function Seguimiento() {
    const { data } = useSeguimientoPublico("tok-123");
    return <p>{data?.status ?? "cargando"}</p>;
  }
  const montar = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Seguimiento />
      </QueryClientProvider>,
    );
  const avanzar = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    focusManager.setFocused(true);
    respuesta = SU_TURNO;
    vi.spyOn(publicApi, "get").mockImplementation(async () => ({ data: respuesta }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    focusManager.setFocused(undefined);
  });

  it("en camino vuelve a consultar cada 30 s", async () => {
    montar();
    await avanzar(0);
    expect(vi.mocked(publicApi.get)).toHaveBeenCalledTimes(1);
    await avanzar(29_000);
    expect(vi.mocked(publicApi.get)).toHaveBeenCalledTimes(1);
    await avanzar(1_000);
    expect(vi.mocked(publicApi.get)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(publicApi.get)).toHaveBeenLastCalledWith("/public/tracking/tok-123", expect.anything());
  });

  it("con la pestaña oculta no consulta", async () => {
    montar();
    await avanzar(0);
    focusManager.setFocused(false);
    await avanzar(90_000);
    expect(vi.mocked(publicApi.get)).toHaveBeenCalledTimes(1);
  });

  it("cuando se entrega deja de consultar solo", async () => {
    respuesta = { ...SU_TURNO, status: "delivered", eta: null, driver: null, location: null };
    montar();
    await avanzar(0);
    await avanzar(90_000);
    expect(screen.getByText("delivered")).toBeTruthy();
    expect(vi.mocked(publicApi.get)).toHaveBeenCalledTimes(1);
  });
});
