// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AlertaOperativa, RespuestaAlertas } from "@/domains/incidencias";

const { handlers, toast } = vi.hoisted(() => ({
  handlers: new Map<string, (payload?: unknown) => void>(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

// El socket compartido se reemplaza por uno que guarda los listeners para dispararlos a mano.
vi.mock("@/shared/lib/socket", () => ({
  crearSocketOperativo: () => ({
    on: (event: string, listener: (payload?: unknown) => void) => { handlers.set(event, listener); },
    off: (event: string) => { handlers.delete(event); },
    disconnect: () => undefined,
  }),
}));
vi.mock("sonner", () => ({ toast }));

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
vi.stubEnv("VITE_SOCKET_URL", "http://localhost:3001");
const { default: api } = await import("@/shared/lib/axios");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
const { CampanaAlertas, CentroAlertas } = await import("@/domains/incidencias");

const alerta = (a: Partial<AlertaOperativa> & Pick<AlertaOperativa, "id" | "kind">): AlertaOperativa => ({
  severity: a.kind === "critical_incident" ? "critical" : "warning",
  zoneId: 3, dispatchId: null, driverId: 7, vehicleId: null, detail: {},
  status: "open", acknowledgedBy: null, acknowledgedAt: null, createdAt: "2026-11-09T14:00:00.000Z",
  ...a,
});

const INCIDENCIA = alerta({ id: 1, kind: "critical_incident", dispatchId: 55, vehicleId: 4, detail: { reasonCode: "INC-ACCIDENT" }, createdAt: "2026-11-09T14:10:00.000Z" });
const SIN_SENAL = alerta({ id: 2, kind: "gps_stale", vehicleId: 4, detail: { lastLocationAt: "2026-11-09T13:50:00.000Z", thresholdMinutes: 5 } });
const ATENDIDA = alerta({ id: 3, kind: "sla_below_threshold", driverId: null, status: "acknowledged", acknowledgedBy: 2, acknowledgedAt: "2026-11-09T14:20:00.000Z", detail: { onTimePercentage: 70, threshold: 85 } });

const pagina = (data: AlertaOperativa[], total = data.length): RespuestaAlertas => ({ data, meta: { page: 1, limit: 100, pages: 1, total } });

function errorHttp(status: number, data: unknown) {
  const config = { url: "/alerts/1/acknowledge", headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, { status, statusText: "", data, headers: {}, config });
}

let abiertas: number;
let get: ReturnType<typeof vi.fn>;
let patch: ReturnType<typeof vi.fn>;
type ParamsGet = { params: { status?: string; limit: number } };
const pedidosContador = () => get.mock.calls.filter(([, config]: [string, ParamsGet]) => config.params.limit === 1);
const pedidosLista = () => get.mock.calls.filter(([, config]: [string, ParamsGet]) => config.params.limit !== 1).map(([, config]: [string, ParamsGet]) => config.params);

beforeEach(() => {
  abiertas = 2;
  get = vi.fn(async (_ruta: string, config: ParamsGet) => {
    if (config.params.limit === 1) return { data: pagina([], abiertas) };
    if (config.params.status === "open") return { data: pagina([SIN_SENAL, INCIDENCIA]) };
    if (config.params.status === "acknowledged") return { data: pagina([ATENDIDA]) };
    return { data: pagina([SIN_SENAL, INCIDENCIA, ATENDIDA]) };
  });
  patch = vi.fn(async () => ({ data: { ...INCIDENCIA, status: "acknowledged" } }));
  vi.spyOn(api, "get").mockImplementation(get as never);
  vi.spyOn(api, "patch").mockImplementation(patch as never);
  useAuthStore.setState({ access_token: "supervisor-token" });
});
afterEach(() => {
  cleanup();
  handlers.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  useAuthStore.setState({ user: null, access_token: null, refresh_token: null });
});

function abrir(ui: React.ReactNode, ruta = "/app/alertas") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("contador de la campana (ST-66.3)", () => {
  it("muestra cuántas alertas siguen abiertas y lleva al centro de alertas", async () => {
    abrir(<CampanaAlertas hrefCentro="/app/alertas" />);

    const campana = await screen.findByRole("link", { name: "Alertas: 2 abiertas" });
    expect(campana.getAttribute("href")).toBe("/app/alertas");
    expect(within(campana).getByTestId("contador-alertas").textContent).toBe("2");
    // Solo pide el total: una alerta abierta por página.
    expect(pedidosContador()[0][1].params).toEqual({ status: "open", page: 1, limit: 1 });
  });

  it("no muestra número sin alertas abiertas y resume en 99+ cuando pasan de 99", async () => {
    abiertas = 0;
    const { unmount } = abrir(<CampanaAlertas hrefCentro="/app/alertas" />);
    await screen.findByRole("link", { name: "Alertas: ninguna abierta" });
    expect(screen.queryByTestId("contador-alertas")).toBeNull();
    unmount();

    abiertas = 150;
    abrir(<CampanaAlertas hrefCentro="/app/alertas" />);
    expect((await screen.findByTestId("contador-alertas")).textContent).toBe("99+");
  });
});

describe("toast al recibir operational.alert_raised (ST-66.3)", () => {
  it("avisa una incidencia crítica con enlace al despacho, sin cerrarse sola, y recarga el contador", async () => {
    abrir(<CampanaAlertas hrefCentro="/app/alertas" />);
    await screen.findByRole("link", { name: "Alertas: 2 abiertas" });
    await waitFor(() => expect(handlers.has("operational.alert_raised")).toBe(true));
    const pedidosAntes = pedidosContador().length;

    abiertas = 3;
    act(() => handlers.get("operational.alert_raised")?.({
      id: 9, kind: "critical_incident", severity: "critical", zoneId: 3, dispatchId: 55, driverId: 7, detail: { reasonCode: "INC-ACCIDENT" },
    }));

    expect(toast.error).toHaveBeenCalledWith("Incidencia crítica", expect.objectContaining({
      id: "alerta-9",
      description: "El despacho #55 reportó una incidencia crítica (INC-ACCIDENT).",
      duration: Infinity,
      action: expect.objectContaining({ label: "Ver despacho" }),
    }));
    expect(await screen.findByRole("link", { name: "Alertas: 3 abiertas" })).toBeTruthy();
    expect(pedidosContador().length).toBeGreaterThan(pedidosAntes);
  });

  it("avisa las advertencias en amarillo con enlace al centro e ignora lo que no es una alerta", async () => {
    abrir(<CampanaAlertas hrefCentro="/app/incidencias" />);
    await waitFor(() => expect(handlers.has("operational.alert_raised")).toBe(true));

    act(() => handlers.get("operational.alert_raised")?.({ id: "x", kind: "otra_cosa" }));
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    act(() => handlers.get("operational.alert_raised")?.({
      id: 10, kind: "gps_stale", severity: "warning", zoneId: null, dispatchId: null, driverId: 7, detail: { lastLocationAt: null, thresholdMinutes: 5 },
    }));
    expect(toast.warning).toHaveBeenCalledWith("Vehículo sin señal", expect.objectContaining({
      description: "Vehículo sin señal sin ninguna posición registrada (umbral: 5 min).",
      duration: 10_000,
      action: expect.objectContaining({ label: "Ver alertas" }),
    }));
  });
});

describe("página Alertas (ST-66.3)", () => {
  it("lista las abiertas, la más nueva primero, con su enlace al despacho o al mapa", async () => {
    abrir(<CentroAlertas />);

    const items = await screen.findAllByRole("listitem");
    expect(items.map((i) => i.getAttribute("aria-label"))).toEqual(["Incidencia crítica, abierta", "Vehículo sin señal, abierta"]);
    expect(within(items[0]).getByRole("link", { name: "Ver despacho" }).getAttribute("href")).toBe("/app/despachos/55");
    expect(within(items[1]).getByRole("link", { name: "Ver en el mapa" }).getAttribute("href")).toBe("/app/mapa?vehiculoId=4");
    expect(pedidosLista()[0]).toEqual({ status: "open", page: 1, limit: 100 });
  });

  it("filtra por tipo en el front y pide todas al back cuando el estado es «Todas»", async () => {
    abrir(<CentroAlertas />, "/app/alertas?tipo=sla_below_threshold&estado=todas");

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText("Zona con 70% de entregas a tiempo hoy (mínimo: 85%).")).toBeTruthy();
    // Atendida: sin botón para marcarla otra vez.
    expect(within(items[0]).queryByRole("button", { name: /Marcar atendida/ })).toBeNull();
    expect(pedidosLista()[0]).toEqual({ page: 1, limit: 100 });
  });

  it("ofrece limpiar los filtros cuando no hay resultados", async () => {
    abrir(<CentroAlertas />, "/app/alertas?tipo=driver_incidents");

    await userEvent.click(await screen.findByRole("button", { name: "Limpiar filtros" }));
    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
  });
});

describe("reconocimiento «Marcar atendida» (ST-66.3)", () => {
  it("marca la alerta, avisa y recarga la lista", async () => {
    abrir(<CentroAlertas />);
    const pedidosAntes = (await screen.findAllByRole("listitem")) && pedidosLista().length;

    await userEvent.click(screen.getByRole("button", { name: "Marcar atendida: Incidencia crítica" }));

    expect(patch).toHaveBeenCalledWith("/alerts/1/acknowledge", undefined, expect.objectContaining({ skipErrorToast: true }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Alerta marcada como atendida."));
    await waitFor(() => expect(pedidosLista().length).toBeGreaterThan(pedidosAntes));
  });

  it("explica el 409 cuando otra persona ya la atendió", async () => {
    patch.mockRejectedValueOnce(errorHttp(409, {
      statusCode: 409, error: "OPERATIONAL_ALERT_ALREADY_ACKNOWLEDGED", message: "This alert was already acknowledged.",
    }));
    abrir(<CentroAlertas />);

    await userEvent.click(await screen.findByRole("button", { name: "Marcar atendida: Vehículo sin señal" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Otra persona ya marcó esta alerta como atendida."));
    expect(toast.success).not.toHaveBeenCalled();
  });
});
