// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FilaSla, IndicadoresFlota, MetricasSla, PeriodoKpi } from "@/domains/reportes";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
const reportes = await import("@/domains/reportes");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: KpisPortalPage } = await import("@/pages/dashboard/kpis-portal-page");

// recharts mide el contenedor con ResizeObserver, que jsdom no trae.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;

const metricas = (m: Partial<MetricasSla>): MetricasSla => ({
  closedCount: 0, deliveredCount: 0, onTimeCount: 0, lateCount: 0, onTimePercentage: 0,
  averageDelayMinutes: null, averageCycleMinutes: null, incidentCount: 0, ...m,
});
const fila = (groupId: number | null, groupName: string | null, m: Partial<MetricasSla>): FilaSla => ({ groupId, groupName, ...metricas(m) });

const ANA = fila(1, "Ana Quispe", { closedCount: 4, deliveredCount: 4, onTimeCount: 3, onTimePercentage: 75, incidentCount: 2 });
const BETO = fila(2, "Beto Mamani", { closedCount: 3, deliveredCount: 3, onTimeCount: 3, onTimePercentage: 100, incidentCount: 0 });
const CARLA = fila(3, "Carla Rojas", { closedCount: 2, deliveredCount: 2, onTimeCount: 2, onTimePercentage: 100, incidentCount: 1 });
const SIN_REPARTIDOR = fila(null, null, { closedCount: 1, deliveredCount: 1, onTimeCount: 1, onTimePercentage: 100 });

const SEMANA: IndicadoresFlota = {
  period: "week", from: "2026-11-02", to: "2026-11-08",
  totals: metricas({ closedCount: 10, deliveredCount: 10, onTimeCount: 9, lateCount: 1, onTimePercentage: 90, incidentCount: 3 }),
  // El back los manda por nombre, con los sin repartidor al final.
  drivers: [ANA, BETO, CARLA, SIN_REPARTIDOR],
  vehicles: [fila(7, "1234-ABC", { deliveredCount: 6, onTimePercentage: 83.3 }), fila(8, "5678-XYZ", { deliveredCount: 4, onTimePercentage: 100 })],
};
const HOY: IndicadoresFlota = {
  ...SEMANA, period: "today", from: "2026-11-08", to: "2026-11-08",
  totals: metricas({ closedCount: 2, deliveredCount: 2, onTimeCount: 1, lateCount: 1, onTimePercentage: 50, incidentCount: 0 }),
  drivers: [BETO], vehicles: [fila(8, "5678-XYZ", { deliveredCount: 2, onTimePercentage: 50 })],
};
const VACIO: IndicadoresFlota = { ...SEMANA, period: "month", from: "2026-11-01", totals: metricas({}), drivers: [], vehicles: [] };

let respuestas: Record<PeriodoKpi, IndicadoresFlota>;
let get: ReturnType<typeof vi.fn>;
const periodosPedidos = () => get.mock.calls.filter(([ruta]) => ruta === "/fleet/kpis").map(([, config]) => config.params.period);

beforeEach(() => {
  respuestas = { today: HOY, week: SEMANA, month: VACIO };
  get = vi.fn(async (_ruta: string, config: { params: { period: PeriodoKpi } }) => ({ data: respuestas[config.params.period] }));
  vi.spyOn(api, "get").mockImplementation(get as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Ubicacion() {
  const { search } = useLocation();
  return <output data-testid="ubicacion">{search}</output>;
}

function abrir(ruta = "/app/kpis") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <KpisPortalPage />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const ranking = () => within(screen.getByRole("region", { name: "Ranking de repartidores" }));
const nombresDelRanking = () => ranking().getAllByRole("row").slice(1).map((f) => within(f).getAllByRole("cell")[0].textContent?.replace(/^\d+\.\s*/, ""));

describe("reglas de los KPIs de flota (ST-61.2)", () => {
  it("lee el período de la URL; sin período o inválido es la semana", () => {
    expect(reportes.leerPeriodoKpi(new URLSearchParams("periodo=today"))).toBe("today");
    expect(reportes.leerPeriodoKpi(new URLSearchParams("periodo=month"))).toBe("month");
    expect(reportes.leerPeriodoKpi(new URLSearchParams("periodo=anio"))).toBe("week");
    expect(reportes.leerPeriodoKpi(new URLSearchParams())).toBe("week");
  });

  it("ordena el ranking por cualquier columna, empata por nombre y deja «Sin repartidor» al final", () => {
    const nombres = (filas: FilaSla[]) => filas.map(reportes.nombreRepartidor);
    const filas = [SIN_REPARTIDOR, ANA, CARLA, BETO];
    expect(nombres(reportes.ordenarRanking(filas, "aTiempo", "desc"))).toEqual(["Beto Mamani", "Carla Rojas", "Ana Quispe", "Sin repartidor"]);
    expect(nombres(reportes.ordenarRanking(filas, "aTiempo", "asc"))).toEqual(["Ana Quispe", "Beto Mamani", "Carla Rojas", "Sin repartidor"]);
    expect(nombres(reportes.ordenarRanking(filas, "incidencias", "desc"))).toEqual(["Ana Quispe", "Carla Rojas", "Beto Mamani", "Sin repartidor"]);
    expect(nombres(reportes.ordenarRanking(filas, "nombre", "desc"))).toEqual(["Carla Rojas", "Beto Mamani", "Ana Quispe", "Sin repartidor"]);
    expect(reportes.direccionInicial("nombre")).toBe("asc");
    expect(reportes.direccionInicial("cerrados")).toBe("desc");
  });

  it("arma el texto del rango y detecta el período sin datos", () => {
    expect(reportes.textoRangoKpi("2026-11-02", "2026-11-08")).toBe("Del 02/11 al 08/11");
    expect(reportes.textoRangoKpi("2026-11-08", "2026-11-08")).toBe("Día 08/11");
    expect(reportes.sinDatosKpi(VACIO)).toBe(true);
    expect(reportes.sinDatosKpi(SEMANA)).toBe(false);
  });
});

describe("tablero de KPIs de flota (ST-61.2)", () => {
  it("abre la semana con las tarjetas del período y su rango", async () => {
    abrir();
    const tarjetas = within(await screen.findByLabelText("Indicadores del período"));
    expect(periodosPedidos()).toEqual(["week"]);
    expect(screen.getByRole("button", { name: "Esta semana" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Esta semana: Del 02/11 al 08/11")).toBeTruthy();
    expect(tarjetas.getByText("Entregas a tiempo")).toBeTruthy();
    expect(tarjetas.getByText("90 %")).toBeTruthy();
    expect(tarjetas.getByText("10")).toBeTruthy();
    expect(tarjetas.getByText("3")).toBeTruthy();
  });

  it("el selector cambia el período, lo pide al back y lo deja en la URL", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByLabelText("Indicadores del período");
    await user.click(screen.getByRole("button", { name: "Hoy" }));
    await waitFor(() => expect(screen.getByText("Hoy: Día 08/11")).toBeTruthy());
    expect(periodosPedidos()).toEqual(["week", "today"]);
    expect(screen.getByRole("button", { name: "Hoy" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Esta semana" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("ubicacion").textContent).toBe("?periodo=today");
    expect(within(screen.getByLabelText("Indicadores del período")).getByText("50 %")).toBeTruthy();
  });

  it("respeta el período de la URL al abrir", async () => {
    abrir("/app/kpis?periodo=today");
    await screen.findByText("Hoy: Día 08/11");
    expect(periodosPedidos()).toEqual(["today"]);
  });

  it("el ranking empieza por % a tiempo y se reordena con los encabezados", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("region", { name: "Ranking de repartidores" });
    expect(nombresDelRanking()).toEqual(["Beto Mamani", "Carla Rojas", "Ana Quispe", "Sin repartidor"]);
    expect(ranking().getByRole("columnheader", { name: /% a tiempo/ }).getAttribute("aria-sort")).toBe("descending");

    await user.click(ranking().getByRole("button", { name: /Incidencias/ }));
    expect(nombresDelRanking()).toEqual(["Ana Quispe", "Carla Rojas", "Beto Mamani", "Sin repartidor"]);
    expect(ranking().getByRole("columnheader", { name: /Incidencias/ }).getAttribute("aria-sort")).toBe("descending");

    // El segundo clic invierte; «Sin repartidor» sigue al final.
    await user.click(ranking().getByRole("button", { name: /Incidencias/ }));
    expect(nombresDelRanking()).toEqual(["Beto Mamani", "Carla Rojas", "Ana Quispe", "Sin repartidor"]);
    expect(ranking().getByRole("columnheader", { name: /Incidencias/ }).getAttribute("aria-sort")).toBe("ascending");

    await user.click(ranking().getByRole("button", { name: /Repartidor/ }));
    expect(nombresDelRanking()).toEqual(["Ana Quispe", "Beto Mamani", "Carla Rojas", "Sin repartidor"]);
  });

  it("muestra el % a tiempo de cada vehículo", async () => {
    abrir();
    const barras = within(await screen.findByRole("figure", { name: "Entregas a tiempo por vehículo" }));
    expect(barras.getByText("1234-ABC: 83,3 % a tiempo de 6 entregados")).toBeTruthy();
    expect(barras.getByText("5678-XYZ: 100 % a tiempo de 4 entregados")).toBeTruthy();
  });

  it("un período sin despachos cerrados muestra «Sin datos para el período seleccionado»", async () => {
    abrir("/app/kpis?periodo=month");
    expect(await screen.findByText("Sin datos para el período seleccionado")).toBeTruthy();
    expect(screen.queryByLabelText("Indicadores del período")).toBeNull();
    expect(screen.queryByRole("region", { name: "Ranking de repartidores" })).toBeNull();
  });

  it("si falla, muestra el error y reintenta", async () => {
    get.mockRejectedValueOnce(new Error("caído"));
    const user = userEvent.setup();
    abrir();
    expect(await screen.findByText("No pudimos cargar los indicadores")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect(await screen.findByLabelText("Indicadores del período")).toBeTruthy();
    expect(periodosPedidos()).toEqual(["week", "week"]);
  });
});
