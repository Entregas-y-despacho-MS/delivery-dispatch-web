// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FilaSla, FilaVehiculoFlota, MetricasSla, ReporteFlota } from "@/domains/reportes";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const { default: api } = await import("@/shared/lib/axios");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
const reportes = await import("@/domains/reportes");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: ReportesPage } = await import("@/pages/dashboard/reportes-page");

// recharts mide el contenedor con ResizeObserver, que jsdom no trae.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;

const metricas = (m: Partial<MetricasSla>): MetricasSla => ({
  closedCount: 0, deliveredCount: 0, onTimeCount: 0, lateCount: 0, onTimePercentage: 0,
  averageDelayMinutes: null, averageCycleMinutes: null, incidentCount: 0, ...m,
});
const vehiculo = (groupId: number | null, groupName: string | null, m: Partial<MetricasSla>, maintenanceCount: number, daysInMaintenance: number): FilaVehiculoFlota =>
  ({ groupId, groupName, ...metricas(m), maintenanceCount, daysInMaintenance });
const repartidor = (groupId: number | null, groupName: string | null, m: Partial<MetricasSla>): FilaSla => ({ groupId, groupName, ...metricas(m) });

const ABC = vehiculo(7, "1234-ABC", { closedCount: 6, deliveredCount: 6, onTimeCount: 5, lateCount: 1, onTimePercentage: 83.3, averageDelayMinutes: 20, incidentCount: 1 }, 1, 2);
const XYZ = vehiculo(8, "5678-XYZ", { closedCount: 4, deliveredCount: 4, onTimeCount: 4, onTimePercentage: 100, incidentCount: 3 }, 0, 0);
// Solo estuvo en el taller: entregas en cero.
const TALLER = vehiculo(9, "9999-TLL", {}, 2, 5);
const SIN_VEHICULO = vehiculo(null, null, { closedCount: 1, deliveredCount: 1, onTimeCount: 1, onTimePercentage: 100 }, 0, 0);

const ANA = repartidor(1, "Ana Quispe", { closedCount: 4, deliveredCount: 4, onTimeCount: 3, lateCount: 1, onTimePercentage: 75, averageDelayMinutes: 20, incidentCount: 2 });
const BETO = repartidor(2, "Beto Mamani", { closedCount: 6, deliveredCount: 6, onTimeCount: 6, onTimePercentage: 100, incidentCount: 0 });
const SIN_REPARTIDOR = repartidor(null, null, { closedCount: 1, deliveredCount: 1, onTimeCount: 1, onTimePercentage: 100 });

const REPORTE: ReporteFlota = {
  from: "2026-10-01", to: "2026-10-31",
  // El back los manda por nombre, con los sin nombre al final.
  drivers: [ANA, BETO, SIN_REPARTIDOR],
  vehicles: [ABC, XYZ, TALLER, SIN_VEHICULO],
};
const VACIO: ReporteFlota = { ...REPORTE, drivers: [], vehicles: [] };

let respuesta: ReporteFlota;
let get: ReturnType<typeof vi.fn>;
const llamadasFlota = () => get.mock.calls.filter(([ruta]) => ruta === "/fleet/reports").map(([, config]) => config.params);
const usuario = (rolId: number) => useAuthStore.setState({
  user: { id: 1, rol: { id: rolId, nombre: rolId === 1 ? "coordinator" : "supervisor" } } as never,
});

beforeEach(() => {
  respuesta = REPORTE;
  usuario(2);
  get = vi.fn(async (ruta: string) => {
    if (ruta === "/fleet/reports") return { data: respuesta };
    // Reporte SLA vacío, por si el coordinador abre esa pestaña.
    return { data: { from: "2026-10-01", to: "2026-10-31", groupBy: "zone", totals: metricas({}), rows: [] } };
  });
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

function abrir(busqueda = "?desde=2026-10-01&hasta=2026-10-31") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/app/reportes${busqueda}`]}>
        <ReportesPage />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const tablaVehiculos = () => within(screen.getByRole("region", { name: "Por vehículo" }));
const tablaRepartidores = () => within(screen.getByRole("region", { name: "Por repartidor" }));
const nombres = (tabla: ReturnType<typeof within>) => tabla.getAllByRole("rowheader").map((celda) => celda.textContent);

describe("reglas del reporte de flota (ST-65.2)", () => {
  it("ordena por cualquier valor, empata por nombre y deja la fila sin nombre al final", () => {
    const porDias = reportes.ordenarFilasFlota(REPORTE.vehicles, (f) => f.daysInMaintenance, "desc", reportes.nombreVehiculo);
    expect(porDias.map(reportes.nombreVehiculo)).toEqual(["9999-TLL", "1234-ABC", "5678-XYZ", "Sin vehículo"]);
    const porNombre = reportes.ordenarFilasFlota(REPORTE.drivers, reportes.nombreRepartidor, "desc", reportes.nombreRepartidor);
    expect(porNombre.map(reportes.nombreRepartidor)).toEqual(["Beto Mamani", "Ana Quispe", "Sin repartidor"]);
  });

  it("sin repartidores ni vehículos no hay datos; el gráfico deja afuera a los vehículos sin entregas", () => {
    expect(reportes.sinDatosFlota(VACIO)).toBe(true);
    expect(reportes.sinDatosFlota(REPORTE)).toBe(false);
    expect(reportes.vehiculosConEntregas(REPORTE.vehicles).map((f) => f.groupName)).toEqual(["1234-ABC", "5678-XYZ", null]);
  });
});

describe("exportación del reporte de flota (ST-65.2)", () => {
  it("las columnas exportadas: las métricas del SLA más los mantenimientos por vehículo", () => {
    const { filtros, vehiculos, repartidores } = reportes.tablasExportacionFlota(REPORTE);
    expect(filtros).toEqual([["Reporte de flota"], ["Desde", "2026-10-01"], ["Hasta", "2026-10-31"]]);
    expect(vehiculos.encabezado).toEqual([
      "Vehículo", "Cerrados", "Entregados", "A tiempo", "Con demora", "% a tiempo",
      "Demora promedio (min)", "Ciclo promedio (min)", "Incidencias", "Mantenimientos", "Días en mantenimiento",
    ]);
    expect(repartidores.encabezado).toEqual([
      "Repartidor", "Cerrados", "Entregados", "A tiempo", "Con demora", "% a tiempo",
      "Demora promedio (min)", "Ciclo promedio (min)", "Incidencias",
    ]);
    expect(vehiculos.filas.map((f) => f[0])).toEqual(["1234-ABC", "5678-XYZ", "9999-TLL", "Sin vehículo"]);
    expect(vehiculos.filas[0]).toEqual(["1234-ABC", 6, 6, 5, 1, 83.3, 20, null, 1, 1, 2]);
    expect(vehiculos.filas[2]).toEqual(["9999-TLL", 0, 0, 0, 0, 0, null, null, 0, 2, 5]);
    expect(repartidores.filas.map((f) => f[0])).toEqual(["Ana Quispe", "Beto Mamani", "Sin repartidor"]);
  });

  it("el CSV lleva BOM, coma y CRLF, con las dos tablas una debajo de otra", () => {
    const csv = reportes.generarCsvFlota(REPORTE);
    expect(csv.startsWith("\uFEFFReporte de flota\r\nDesde,2026-10-01\r\nHasta,2026-10-31\r\n\r\nVehículos\r\n")).toBe(true);
    expect(csv).toContain("\r\nVehículo,Cerrados,Entregados,A tiempo,Con demora,% a tiempo,Demora promedio (min),Ciclo promedio (min),Incidencias,Mantenimientos,Días en mantenimiento\r\n");
    expect(csv).toContain("\r\n9999-TLL,0,0,0,0,0,,,0,2,5\r\n");
    expect(csv).toContain("\r\n\r\nRepartidores\r\nRepartidor,Cerrados,");
    expect(csv.endsWith("\r\nSin repartidor,1,1,1,0,100,,,0\r\n")).toBe(true);
  });

  it("el Excel es un .xlsx con una hoja por tabla y las mismas columnas", () => {
    const hojas = reportes.hojasExcelFlota(REPORTE);
    expect(hojas.map((h) => h.nombre)).toEqual(["Vehículos", "Repartidores"]);
    expect(hojas[0].filas[4]).toEqual([...reportes.COLUMNAS_VEHICULO_FLOTA]);
    expect(hojas[1].filas[4]).toEqual([...reportes.COLUMNAS_REPARTIDOR_FLOTA]);

    const bytes = reportes.generarExcelFlota(REPORTE);
    // Firma ZIP «PK\x03\x04».
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const texto = new TextDecoder().decode(bytes);
    expect(texto).toContain("xl/worksheets/sheet2.xml");
    expect(texto).toContain('<sheet name="Vehículos"');
    expect(texto).toContain("Días en mantenimiento");
    expect(reportes.letraColumna(10)).toBe("K");
  });

  it("el nombre del archivo lleva el período", () => {
    expect(reportes.nombreArchivoFlota(REPORTE, "csv")).toBe("reporte-flota-2026-10-01_2026-10-31.csv");
    expect(reportes.nombreArchivoFlota(REPORTE, "xlsx")).toBe("reporte-flota-2026-10-01_2026-10-31.xlsx");
  });
});

describe("pantalla del reporte de flota (ST-65.2)", () => {
  it("el supervisor ve solo el reporte de flota y se consulta con el rango de la URL", async () => {
    abrir();
    await screen.findByRole("region", { name: "Por vehículo" });
    expect(llamadasFlota()).toEqual([{ from: "2026-10-01", to: "2026-10-31" }]);
    expect(get.mock.calls.some(([ruta]) => ruta === "/reports/sla")).toBe(false);
    expect(screen.getByRole("heading", { name: "Reporte de flota" })).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    // Empieza por más días en mantenimiento.
    expect(nombres(tablaVehiculos())).toEqual(["9999-TLL", "1234-ABC", "5678-XYZ", "Sin vehículo"]);
    expect(nombres(tablaRepartidores())).toEqual(["Beto Mamani", "Ana Quispe", "Sin repartidor"]);
    expect(screen.getByRole("figure", { name: "Entregas a tiempo por vehículo" })).toBeTruthy();
  });

  it("las tablas se ordenan con los encabezados y el segundo clic invierte", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("region", { name: "Por vehículo" });
    await user.click(tablaVehiculos().getByRole("button", { name: /Incidencias/ }));
    expect(nombres(tablaVehiculos())).toEqual(["5678-XYZ", "1234-ABC", "9999-TLL", "Sin vehículo"]);
    expect(tablaVehiculos().getByRole("columnheader", { name: /Incidencias/ }).getAttribute("aria-sort")).toBe("descending");
    await user.click(tablaVehiculos().getByRole("button", { name: /Incidencias/ }));
    expect(nombres(tablaVehiculos())).toEqual(["9999-TLL", "1234-ABC", "5678-XYZ", "Sin vehículo"]);
    expect(tablaVehiculos().getByRole("columnheader", { name: /Incidencias/ }).getAttribute("aria-sort")).toBe("ascending");
    await user.click(tablaRepartidores().getByRole("button", { name: /Repartidor/ }));
    expect(nombres(tablaRepartidores())).toEqual(["Ana Quispe", "Beto Mamani", "Sin repartidor"]);
  });

  it("al cambiar el rango vuelve a consultar y lo deja en la URL", async () => {
    abrir();
    await screen.findByRole("region", { name: "Por vehículo" });
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-10-15" } });
    await waitFor(() => expect(llamadasFlota().at(-1)).toEqual({ from: "2026-10-15", to: "2026-10-31" }));
    expect(screen.getByTestId("ubicacion").textContent).toContain("desde=2026-10-15");
  });

  it("con el rango al revés avisa, no consulta y no deja exportar", async () => {
    abrir("?desde=2026-10-31&hasta=2026-10-01");
    expect((await screen.findByRole("alert")).textContent).toContain("no puede ser posterior");
    expect(llamadasFlota()).toEqual([]);
    expect(screen.getByRole("button", { name: /Actualizar/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Exportar CSV/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Exportar Excel/ }).hasAttribute("disabled")).toBe(true);
  });

  it("con más de 366 días avisa y no consulta", async () => {
    abrir("?desde=2025-01-01&hasta=2026-01-02");
    expect((await screen.findByRole("alert")).textContent).toContain("366 días");
    expect(llamadasFlota()).toEqual([]);
  });

  it("sin datos muestra «Sin datos para el período seleccionado» y no deja exportar", async () => {
    respuesta = VACIO;
    abrir();
    expect(await screen.findByText("Sin datos para el período seleccionado")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Exportar CSV/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Exportar Excel/ }).hasAttribute("disabled")).toBe(true);
  });

  it("con datos deja exportar a CSV y a Excel", async () => {
    abrir();
    await screen.findByRole("region", { name: "Por vehículo" });
    expect(screen.getByRole("button", { name: /Exportar CSV/ }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: /Exportar Excel/ }).hasAttribute("disabled")).toBe(false);
  });

  it("si el back falla muestra el error y reintenta", async () => {
    get.mockRejectedValueOnce(Object.assign(new Error("Network Error"), { isAxiosError: true, code: "ERR_NETWORK" }));
    const user = userEvent.setup();
    abrir();
    await user.click(await screen.findByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByRole("region", { name: "Por vehículo" })).toBeTruthy();
    expect(llamadasFlota()).toHaveLength(2);
  });

  it("el coordinador abre en SLA y con la pestaña Flota pasa al reporte de flota", async () => {
    usuario(1);
    const user = userEvent.setup();
    abrir();
    expect((await screen.findByRole("tab", { name: "Cumplimiento SLA" })).getAttribute("aria-selected")).toBe("true");
    expect(llamadasFlota()).toEqual([]);
    await user.click(screen.getByRole("tab", { name: "Flota" }));
    await screen.findByRole("region", { name: "Por vehículo" });
    expect(screen.getByRole("tab", { name: "Flota" }).getAttribute("aria-selected")).toBe("true");
    expect(llamadasFlota()).toEqual([{ from: "2026-10-01", to: "2026-10-31" }]);
    expect(screen.getByTestId("ubicacion").textContent).toContain("vista=flota");
  });
});
