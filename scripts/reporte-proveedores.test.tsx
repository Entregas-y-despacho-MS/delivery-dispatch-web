// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
const { ReporteProveedoresPanel } = await import("@/domains/reportes");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/reportes/reportes.proveedores");
// oxlint-disable-next-line no-restricted-imports -- la página se prueba entera para las pestañas por rol.
const { default: ReportesPage } = await import("@/pages/dashboard/reportes-page");

const excepcion = (dispatchId: number, e: Record<string, unknown> = {}) => ({
  dispatchId, category: "openOverdue", status: "pickup_scheduled", purchaseOrderRef: `OC-${dispatchId}`,
  supplier: { id: "SUP-1", name: "Distribuidora Andina" }, destinationWarehouseId: 1,
  window: { start: "2026-11-20T12:00:00Z", end: "2026-11-20T14:00:00Z" }, originalWindow: null, rescheduledAt: null,
  custodyReceivedAt: null, arrivedAtWarehouseAt: null, ...e,
});
const EXCEPCIONES = [
  excepcion(51, { category: "failed", status: "not_delivered" }),
  ...Array.from({ length: 11 }, (_, i) => excepcion(60 + i, i === 0 ? { supplier: null, destinationWarehouseId: 2, originalWindow: { start: "2026-11-18T12:00:00Z", end: "2026-11-18T14:00:00Z" } } : {})),
];
const REPORTE = {
  from: "2026-11-01", to: "2026-11-25", dateBasis: "appointment_window_end", timeZone: "America/La_Paz", asOf: "2026-11-25T15:00:00Z",
  filters: { supplierId: null, warehouseId: null, zoneId: null, status: null },
  metrics: { numerator: 15, denominator: 20, n: 20, percentage: 75, unavailableReason: null },
  counts: { onTime: 15, late: 3, failed: 2, openOverdue: 10, pendingNotDue: 6, cancelled: 1, noValidAppointment: 1, unknownTiming: 0 },
  rescheduledCount: 2, originalExpiredBeforeRescheduleCount: 1, exceptionsTotal: 15, exceptions: EXCEPCIONES, empty: false,
};

let respuesta: unknown;
let get: ReturnType<typeof vi.fn>;
const pedidos = () => get.mock.calls.filter(([u]) => u === "/reports/supplier-pickups").map(([, c]) => c.params);

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  respuesta = REPORTE;
  get = vi.fn(async (u: string) => (u === "/warehouses"
    ? { data: { data: [{ id: 1, name: "Central" }, { id: 2, name: "El Alto" }] } }
    : u === "/reports/supplier-pickups" ? { data: respuesta } : { data: { data: [], meta: { page: 1, limit: 100, pages: 0, total: 0 } } }));
  vi.spyOn(api, "get").mockImplementation(get as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Ubicacion() {
  return <output data-testid="ubicacion">{useLocation().search}</output>;
}
function abrir(ui = <ReporteProveedoresPanel />, ruta = "/app/reportes?vista=proveedores&desde=2026-11-01&hasta=2026-11-25") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        {ui}
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("reglas de proveedores (ST-305.2)", () => {
  it("volumen suma todas las categorías; sin denominador el cumplimiento es N/D", () => {
    expect(reglas.volumenRecojos(REPORTE.counts as never)).toBe(38);
    expect(reglas.textoCumplimiento({ ...REPORTE.metrics, percentage: null })).toBe("N/D");
    expect(reglas.textoCumplimiento(REPORTE.metrics)).toBe("75 %");
    const f = reglas.leerFiltrosProveedores(new URLSearchParams("desde=2026-11-01&hasta=2026-11-25&proveedor=SUP-1&almacen=2&estadoRecojo=incident"));
    expect(reglas.paramsProveedores(f)).toEqual({ from: "2026-11-01", to: "2026-11-25", exceptionLimit: 100, supplierId: "SUP-1", warehouseId: 2, status: "incident" });
  });
});

describe("desempeño de proveedores (ST-305.2)", () => {
  it("muestra cumplimiento con n, volumen, pendientes y excepciones; cada excepción abre el recojo", async () => {
    abrir();
    expect(await screen.findByText("75 %")).toBeTruthy();
    expect(screen.getByText("15 / 20 · n = 20")).toBeTruthy();
    expect(screen.getByText("38")).toBeTruthy();
    const tabla = within(screen.getByRole("table", { name: "Excepciones de recojo" }));
    expect(tabla.getByRole("link", { name: "#51" }).getAttribute("href")).toBe("/app/despachos/51");
    expect(tabla.getByText("Proveedor sin registrar")).toBeTruthy();
    expect(tabla.getByText(/Original:/)).toBeTruthy();
    expect(within(screen.getByLabelText("Excepciones por almacén destino")).getByText("El Alto")).toBeTruthy();
    expect(screen.getByText(/Se muestran las 12 más vencidas de 15/)).toBeTruthy();
  });

  it("pagina las excepciones y los filtros van a la URL y al back", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByText("75 %");
    expect(within(screen.getByRole("table", { name: "Excepciones de recojo" })).getAllByRole("row")).toHaveLength(11);
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(within(screen.getByRole("table", { name: "Excepciones de recojo" })).getAllByRole("row")).toHaveLength(3);
    await user.selectOptions(screen.getByLabelText("Almacén destino"), "2");
    await user.type(screen.getByLabelText("Proveedor (ID de Compras)"), "SUP-1");
    await waitFor(() => expect(pedidos().at(-1)).toMatchObject({ warehouseId: 2, supplierId: "SUP-1" }));
    expect(screen.getByTestId("ubicacion").textContent).toContain("almacen=2");
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    // Sin filtros vuelve a la consulta inicial (ya en caché) y la URL queda limpia.
    await waitFor(() => expect(screen.getByTestId("ubicacion").textContent).not.toContain("almacen="));
    expect(screen.getByTestId("ubicacion").textContent).not.toContain("proveedor=");
  });

  it("vacío y N/D se muestran sin ceros inventados", async () => {
    respuesta = { ...REPORTE, empty: true, exceptions: [], exceptionsTotal: 0 };
    abrir();
    expect(await screen.findByText("Sin recojos en el período")).toBeTruthy();
  });

  it("solo el coordinador ve la pestaña Proveedores", async () => {
    useAuthStore.setState({ user: { id: "1", rol: { id: 2, nombre: "supervisor" } } as never });
    abrir(<ReportesPage />, "/app/reportes?vista=proveedores");
    await screen.findAllByRole("tab");
    expect(screen.queryByRole("tab", { name: "Proveedores" })).toBeNull();
    expect(pedidos()).toHaveLength(0);
    cleanup();
    useAuthStore.setState({ user: { id: "1", rol: { id: 1, nombre: "coordinator" } } as never });
    abrir(<ReportesPage />, "/app/reportes?vista=proveedores");
    expect((await screen.findByRole("tab", { name: "Proveedores" })).getAttribute("aria-selected")).toBe("true");
  });
});
