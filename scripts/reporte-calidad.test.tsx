// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
const { ReporteCalidadPanel } = await import("@/domains/reportes");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/reportes/reportes.calidad");

const kpi = (k: Partial<Record<string, unknown>>) => ({
  code: "x", formula: "x", unit: "percent", numerator: 3, denominator: 40, n: 40, value: 7.5, available: true, reason: null, dateBasis: "promise_window_end", ...k,
});
const REPORTE = {
  period: { from: "2026-11-01", to: "2026-11-25", timeZone: "America/La_Paz" },
  filters: { zoneId: null, status: null, incidentReasonId: null, reasonCode: null, rescheduled: null },
  kpis: {
    incidentRate: kpi({ code: "incident_rate" }),
    rescheduleRate: kpi({ code: "reschedule_rate", numerator: 0, denominator: 0, n: 0, value: null }),
    complaintRate: kpi({ code: "complaint_rate", numerator: 2, denominator: 20, n: 20, value: 10, dateBasis: "closed_at" }),
    investigationTime: kpi({ code: "investigation_time", unit: "minutes", numerator: null, denominator: null, n: 1, value: 135, dateBasis: "closed_at" }),
    ratingAverage: kpi({ code: "rating_average", unit: "score", numerator: null, denominator: null, n: 0, value: null, available: false, reason: "rating_not_authorized", dateBasis: "closed_at" }),
    responseRate: kpi({ code: "response_rate", numerator: null, denominator: null, n: 0, value: null, available: false, reason: "response_opportunity_not_recorded", dateBasis: "closed_at" }),
  },
  details: {
    attempts: { attemptCount: 40, attemptsWithIncidentCount: 3, dispatchesWithIncidentCount: 3, incidentEventCount: 4, incidentsWithoutAttemptCount: 0, notReconstructableCount: 0 },
    reschedules: { rescheduledDispatchCount: 0, rescheduleEventCount: 0, reassignmentOnlyCount: 0, eligibleDispatchCount: 0 },
    complaints: { caseCount: 2, dispatchesWithCaseCount: 2, deliveredDispatchCount: 20, decidedWithoutTimestampsCount: 0, open: { count: 1, oldestAgeMinutes: 3000 } },
    attemptCoverage: { from: "2026-10-01T00:00:00.000Z", complete: true },
  },
  tables: {
    cases: { data: [
      { caseId: 12, dispatchId: 112, reasonCode: "DAMAGED_ITEM", investigationStatus: "decided", openedAt: "2026-11-20T12:00:00Z", investigationStartedAt: "2026-11-20T13:00:00Z", decidedAt: "2026-11-20T14:15:00Z", open: false, ageMinutes: null },
      { caseId: 13, dispatchId: 113, reasonCode: "LATE", investigationStatus: "received", openedAt: "2026-11-23T15:00:00Z", investigationStartedAt: null, decidedAt: null, open: true, ageMinutes: 3000 },
    ], meta: { page: 1, limit: 10, pages: 1, total: 2 } },
    dispatches: { data: [
      { dispatchId: 112, status: "delivered", attemptCount: 1, attemptsWithIncidentCount: 0, incidentEventCount: 0, rescheduled: false, reconstructable: true },
      { dispatchId: 140, status: "delivered", attemptCount: 0, attemptsWithIncidentCount: 0, incidentEventCount: 0, rescheduled: true, reconstructable: false },
    ], meta: { page: 1, limit: 10, pages: 3, total: 25 } },
  },
  sources: ["dispatches"],
};

let get: ReturnType<typeof vi.fn>;
const pedidos = () => get.mock.calls.filter(([u]) => u === "/reports/quality").map(([, c]) => c.params);

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  get = vi.fn(async () => ({ data: REPORTE }));
  vi.spyOn(api, "get").mockImplementation(get as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Ubicacion() {
  return <output data-testid="ubicacion">{useLocation().search}</output>;
}
function abrir(ruta = "/app/reportes?vista=calidad&desde=2026-11-01&hasta=2026-11-25") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <ReporteCalidadPanel zonas={[{ id: 3, nombre: "Centro" }]} motivosIncidencia={[{ id: 5, nombre: "Cliente ausente" }]} />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("reglas de calidad (ST-300.3)", () => {
  it("N/D, «Sin datos» y valores con su unidad; nunca un cero inventado", () => {
    expect(reglas.valorKpi(kpi({ available: false, value: null }) as never)).toBe("N/D");
    expect(reglas.valorKpi(kpi({ value: null }) as never)).toBe("Sin datos");
    expect(reglas.valorKpi(kpi({ value: 12.5 }) as never)).toBe("12,5 %");
    expect(reglas.valorKpi(kpi({ unit: "minutes", value: 135 }) as never)).toBe("2 h 15 min");
    expect(reglas.valorKpi(kpi({ unit: "score", value: 4.25 }) as never)).toBe("4,25 / 5");
    expect(reglas.detalleKpi(kpi({}) as never)).toBe("3 / 40 · n = 40");
  });

  it("la distribución por motivo solo con todos los casos en la página", () => {
    expect(reglas.distribucionPorMotivo(REPORTE.tables.cases as never)).toEqual([{ motivo: "DAMAGED_ITEM", cantidad: 1 }, { motivo: "LATE", cantidad: 1 }]);
    expect(reglas.distribucionPorMotivo({ ...REPORTE.tables.cases, meta: { ...REPORTE.tables.cases.meta, total: 30 } } as never)).toBeNull();
  });
});

describe("Dashboard 4 de calidad (ST-300.3)", () => {
  it("muestra cada indicador con numerador, denominador, n y la causa del N/D", async () => {
    abrir();
    const kpis = within(await screen.findByLabelText("Indicadores de calidad"));
    expect(kpis.getByText("7,5 %")).toBeTruthy();
    expect(kpis.getByText("3 / 40 · n = 40")).toBeTruthy();
    expect(kpis.getByText("Sin datos")).toBeTruthy();
    expect(kpis.getByText("2 h 15 min")).toBeTruthy();
    expect(kpis.getAllByText("N/D")).toHaveLength(2);
    expect(kpis.getByText(/la ve solo el Supervisor/)).toBeTruthy();
    expect(kpis.getByText(/Todavía no se registra la invitación/)).toBeTruthy();
    expect(screen.getByText(/el más antiguo lleva 2 d 2 h/)).toBeTruthy();
  });

  it("las tablas abren el reclamo y el despacho; un despacho sin intentos reconstruibles es N/D", async () => {
    abrir();
    const casos = within(await screen.findByRole("table", { name: "Casos" }));
    expect(casos.getByRole("link", { name: "#12" }).getAttribute("href")).toBe("/app/reclamos?caso=12");
    const despachos = within(screen.getByRole("table", { name: "Despachos de la cohorte" }));
    expect(despachos.getByRole("link", { name: "#140" }).getAttribute("href")).toBe("/app/despachos/140");
    expect(despachos.getAllByText("N/D")).toHaveLength(2);
  });

  it("todos los filtros van al mismo pedido de KPIs y tablas y a la URL", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByLabelText("Indicadores de calidad");
    await user.selectOptions(screen.getByLabelText("Zona"), "3");
    await user.selectOptions(screen.getByLabelText("Motivo de incidencia"), "5");
    await user.selectOptions(screen.getByLabelText("Reprogramación"), "si");
    await user.selectOptions(screen.getByLabelText("Estado del despacho"), "delivered");
    await waitFor(() => expect(pedidos().at(-1)).toEqual({
      from: "2026-11-01", to: "2026-11-25", page: 1, limit: 10, order: "desc", zoneId: 3, incidentReasonId: 5, rescheduled: true, status: "delivered",
    }));
    expect(screen.getByTestId("ubicacion").textContent).toContain("reprogramado=si");
  });

  it("con el período al revés no consulta", async () => {
    abrir("/app/reportes?vista=calidad&desde=2026-11-25&hasta=2026-11-01");
    expect((await screen.findByRole("alert")).textContent).toMatch(/no puede ser posterior/);
    expect(pedidos()).toHaveLength(0);
  });
});
