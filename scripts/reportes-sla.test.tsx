// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FilaSla, MetricasSla, ReporteSla } from "@/domains/reportes";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const { default: api } = await import("@/shared/lib/axios");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/reportes/reportes.reglas");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la exportación directamente.
const exportar = await import("@/domains/reportes/reportes.exportar");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: ReportesPage } = await import("@/pages/dashboard/reportes-page");

// recharts mide el contenedor con ResizeObserver, que jsdom no trae.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;

const metricas = (m: Partial<MetricasSla>): MetricasSla => ({
  closedCount: 0, deliveredCount: 0, onTimeCount: 0, lateCount: 0, onTimePercentage: 0,
  averageDelayMinutes: null, averageCycleMinutes: null, incidentCount: 0, ...m,
});
const SUR: FilaSla = { groupId: 1, groupName: "Zona Sur", ...metricas({ closedCount: 6, deliveredCount: 5, onTimeCount: 4, lateCount: 1, onTimePercentage: 80, averageDelayMinutes: 25, averageCycleMinutes: 99.2 }) };
const CENTRO: FilaSla = { groupId: 2, groupName: "Centro", ...metricas({ closedCount: 2, deliveredCount: 1, lateCount: 1, averageDelayMinutes: 70, averageCycleMinutes: 190, incidentCount: 1 }) };
const SIN_ZONA: FilaSla = { groupId: null, groupName: null, ...metricas({ closedCount: 1, deliveredCount: 1, onTimeCount: 1, onTimePercentage: 100, averageCycleMinutes: 60 }) };
const REPORTE: ReporteSla = {
  from: "2026-10-01", to: "2026-10-31", groupBy: "zone",
  totals: metricas({ closedCount: 9, deliveredCount: 7, onTimeCount: 5, lateCount: 2, onTimePercentage: 71.4, averageDelayMinutes: 47.5, averageCycleMinutes: 114.2, incidentCount: 1 }),
  // El back ordena por nombre, con el grupo sin nombre al final.
  rows: [CENTRO, SUR, SIN_ZONA],
};

let respuesta: ReporteSla = REPORTE;
const usuario = (rolId: number) => useAuthStore.setState({
  user: { id: 1, rol: { id: rolId, nombre: rolId === 1 ? "coordinator" : "supervisor" } } as never,
});

beforeEach(() => {
  respuesta = REPORTE;
  usuario(1);
  vi.spyOn(api, "get").mockImplementation(async (_ruta: string, config?: { params?: { groupBy?: string } }) =>
    ({ data: { ...respuesta, groupBy: config?.params?.groupBy ?? respuesta.groupBy } }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function abrir(busqueda = "?desde=2026-10-01&hasta=2026-10-31&agrupar=zone") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/app/reportes${busqueda}`]}>
        <ReportesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("reglas del reporte SLA (ST-54.1)", () => {
  it("lee los filtros de la URL y lo inválido toma el valor por defecto: del 1 del mes a hoy, por zona", () => {
    const ahora = new Date("2026-11-06T15:00:00Z");
    expect(reglas.leerFiltrosSla(new URLSearchParams("desde=2026-10-01&hasta=2026-10-31&agrupar=driver"), ahora))
      .toEqual({ desde: "2026-10-01", hasta: "2026-10-31", agrupacion: "driver" });
    expect(reglas.leerFiltrosSla(new URLSearchParams("desde=ayer&agrupar=marte"), ahora))
      .toEqual({ desde: "2026-11-01", hasta: "2026-11-06", agrupacion: "zone" });
  });

  it("detecta el rango vacío, al revés o de más de 366 días, como el back", () => {
    expect(reglas.problemaRango({ desde: "", hasta: "2026-10-31" })).toBe("incompleto");
    expect(reglas.problemaRango({ desde: "2026-10-31", hasta: "2026-10-01" })).toBe("invertido");
    // 366 días (con los dos extremos) es el máximo; 367 ya no.
    expect(reglas.problemaRango({ desde: "2025-01-01", hasta: "2026-01-01" })).toBeNull();
    expect(reglas.problemaRango({ desde: "2025-01-01", hasta: "2026-01-02" })).toBe("muy-largo");
  });

  it("ordena el detalle por mayor demora y muestra los minutos legibles", () => {
    expect(reglas.filasPorDemora(REPORTE.rows).map((f) => f.groupName)).toEqual(["Centro", "Zona Sur", null]);
    expect(reglas.formatoMinutos(null)).toBe("—");
    expect(reglas.formatoMinutos(18.5)).toBe("18,5 min");
    expect(reglas.formatoMinutos(143.2)).toBe("2 h 23 min");
    expect(reglas.nombreGrupo(SIN_ZONA, "driver")).toBe("Sin repartidor");
  });
});

describe("exportación del reporte SLA (ST-54.1)", () => {
  it("el archivo trae los filtros aplicados, las columnas de la tabla y la fila de totales", () => {
    const { filtros, encabezado, filas } = exportar.tablaExportacion(REPORTE);
    expect(filtros).toEqual([["Reporte de cumplimiento SLA"], ["Desde", "2026-10-01"], ["Hasta", "2026-10-31"], ["Agrupado por", "Zona"]]);
    expect(encabezado).toEqual(["Zona", "Cerrados", "Entregados", "A tiempo", "Con demora", "% a tiempo", "Demora promedio (min)", "Ciclo promedio (min)", "Incidencias"]);
    expect(filas.map((f) => f[0])).toEqual(["Centro", "Zona Sur", "Sin zona", "Total"]);
    expect(filas[0]).toEqual(["Centro", 2, 1, 0, 1, 0, 70, 190, 1]);
    expect(filas[3]).toEqual(["Total", 9, 7, 5, 2, 71.4, 47.5, 114.2, 1]);
  });

  it("el CSV es UTF-8 con BOM, coma y CRLF, y neutraliza fórmulas", () => {
    const csv = exportar.generarCsv(REPORTE);
    expect(csv.startsWith("﻿Reporte de cumplimiento SLA\r\n")).toBe(true);
    expect(csv).toContain("\r\nZona,Cerrados,Entregados,A tiempo,Con demora,% a tiempo,Demora promedio (min),Ciclo promedio (min),Incidencias\r\n");
    expect(csv).toContain("\r\nSin zona,1,1,1,0,100,,60,0\r\n");
    expect(exportar.celdaCsv("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(exportar.celdaCsv("Zona, Sur")).toBe("\"Zona, Sur\"");
    expect(exportar.celdaCsv(-5)).toBe("-5");
  });

  it("el nombre del archivo lleva la agrupación y el período", () => {
    expect(exportar.nombreArchivoSla(REPORTE, "csv")).toBe("reporte-sla-zona-2026-10-01_2026-10-31.csv");
    expect(exportar.nombreArchivoSla({ ...REPORTE, groupBy: "service_level" }, "xlsx")).toBe("reporte-sla-nivel-servicio-2026-10-01_2026-10-31.xlsx");
  });
});

describe("pantalla del reporte SLA (ST-54.1)", () => {
  it("consulta con los filtros de la URL y muestra resumen, medidor y detalle por mayor demora", async () => {
    abrir();
    const tabla = await screen.findByRole("table");
    expect(vi.mocked(api.get)).toHaveBeenCalledWith("/reports/sla",
      expect.objectContaining({ params: { from: "2026-10-01", to: "2026-10-31", groupBy: "zone" } }));
    expect(screen.getByRole("meter", { name: "Porcentaje de entregas a tiempo" }).getAttribute("aria-valuenow")).toBe("71.4");
    expect(screen.getByText("Por debajo del umbral")).toBeTruthy();
    const filas = within(tabla).getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("rowheader")[0].textContent);
    expect(filas).toEqual(["Centro", "Zona Sur", "Sin zona", "Total"]);
  });

  it("al cambiar la agrupación vuelve a consultar al back", async () => {
    const u = userEvent.setup();
    abrir();
    await screen.findByRole("table");
    await u.selectOptions(screen.getByLabelText("Agrupar por"), "driver");
    await waitFor(() => expect(vi.mocked(api.get)).toHaveBeenLastCalledWith("/reports/sla",
      expect.objectContaining({ params: { from: "2026-10-01", to: "2026-10-31", groupBy: "driver" } })));
    expect(await screen.findByRole("columnheader", { name: "Repartidor" })).toBeTruthy();
  });

  it("con el rango al revés avisa, no consulta y no deja exportar", async () => {
    abrir("?desde=2026-10-31&hasta=2026-10-01&agrupar=zone");
    expect((await screen.findByRole("alert")).textContent).toContain("no puede ser posterior");
    expect(vi.mocked(api.get)).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Actualizar/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Exportar CSV/ }).hasAttribute("disabled")).toBe(true);
  });

  it("sin datos muestra «Sin datos para el período seleccionado» y no deja exportar", async () => {
    respuesta = { ...REPORTE, totals: metricas({}), rows: [] };
    abrir();
    expect(await screen.findByText("Sin datos para el período seleccionado")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Exportar CSV/ }).hasAttribute("disabled")).toBe(true);
  });

  it("si el back falla muestra el error con reintento", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(Object.assign(new Error("Network Error"), { isAxiosError: true, code: "ERR_NETWORK" }));
    abrir();
    expect(await screen.findByRole("button", { name: /Reintentar/ })).toBeTruthy();
  });

  it("el supervisor ve el aviso y no se consulta al back", async () => {
    usuario(2);
    abrir();
    expect(await screen.findByText("Reporte disponible solo para el Coordinador")).toBeTruthy();
    expect(vi.mocked(api.get)).not.toHaveBeenCalled();
  });
});
