// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el hook directamente.
const { useHistorialDespachos } = await import("@/domains/despachos/hooks/use-historial-despachos");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan los componentes directamente.
const { HistorialDespachosToolbar } = await import("@/domains/despachos/components/historial-despachos-toolbar");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan los componentes directamente.
const { HistorialDespachosVista } = await import("@/domains/despachos/components/historial-despachos-vista");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas de la URL directamente.
const url = await import("@/domains/despachos/historial.url");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el servicio directamente.
const { nombreArchivoCsv } = await import("@/domains/despachos/services/historial-despachos.service");

const FILA = {
  id: 7, trackingCode: "DSP-2026-00007", recipient: "María Pérez", driverId: 3, driverName: "Juan Rojas", plate: "2345-ABC",
  departedAt: "2026-10-18T12:00:00Z", deliveredAt: "2026-10-18T14:30:00Z", status: "delivered", closedAt: "2026-10-18T14:30:00Z",
};
const SIN_RUTA = { ...FILA, id: 8, trackingCode: "DSP-2026-00008", driverId: null, driverName: null, plate: null, departedAt: null, deliveredAt: null, status: "cancelled" };

let lista: { data: unknown[]; total: number } = { data: [FILA, SIN_RUTA], total: 2 };
let get: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  lista = { data: [FILA, SIN_RUTA], total: 2 };
  get = vi.spyOn(api, "get").mockImplementation(async (ruta: string, config?: { params?: { page?: number; limit?: number } }) => {
    if (ruta === "/dispatches/history/export") {
      return { data: new Blob(["a,b"]), headers: { "content-disposition": 'attachment; filename="historial-despachos-2026-10-19.csv"' } };
    }
    return { data: { ...lista, page: config?.params?.page ?? 1, limit: config?.params?.limit ?? 10 }, headers: {} };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ruta = { search: "" };
function Ubicacion() {
  const { search } = useLocation();
  useEffect(() => { ruta.search = search; }, [search]);
  return null;
}

/** Arma la pantalla igual que la página, con un catálogo de conductores fijo. */
function Pantalla() {
  const h = useHistorialDespachos();
  const { historial, filtros } = h;
  return (
    <>
      <HistorialDespachosToolbar
        busqueda={h.busqueda} onBusquedaChange={h.setBusqueda} desde={filtros.desde} onDesdeChange={h.setDesde}
        hasta={filtros.hasta} onHastaChange={h.setHasta} conductores={[{ id: 3, name: "Juan Rojas" }]} conductor={filtros.conductor}
        onConductorChange={h.setConductor} placa={h.placa} onPlacaChange={h.setPlaca} estado={filtros.estado} onEstadoChange={h.setEstado}
        rangoInvertido={h.rangoInvertido} onExportar={h.exportar} exportando={h.exportando} puedeExportar={historial.total > 0}
        onRefrescar={h.refrescar} refrescando={historial.isFetching}
      />
      {!h.rangoInvertido && (
        <HistorialDespachosVista
          data={historial.data} cargando={historial.isLoading} error={historial.isError ? historial.error : undefined}
          onReintentar={h.refrescar} filtrada={h.hayFiltros} onLimpiarFiltros={h.limpiarFiltros}
          orden={filtros.orden} dir={filtros.dir} onToggleOrden={h.toggleOrden} hrefFicha={(id) => `/app/despachos/${id}`}
        />
      )}
      <Ubicacion />
    </>
  );
}

function abrir(busqueda = "") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/app/historial${busqueda}`]}><Pantalla /></MemoryRouter>
    </QueryClientProvider>,
  );
}

const ultimaConsulta = () => {
  const llamadas = get.mock.calls.filter(([ruta]) => ruta === "/dispatches/history");
  const config = llamadas.at(-1)?.[1] as { params: Record<string, unknown> } | undefined;
  return config?.params;
};

describe("filtros del historial en la URL (ST-55.1)", () => {
  it("lee la URL, ignora lo inválido y por defecto ordena por cierre, lo más reciente primero", () => {
    const f = url.leerFiltrosHistorial(new URLSearchParams("estado=delivered&conductor=3&desde=2026-10-01&hasta=2026-02-31&orden=hackeo&pagina=0&filas=7"));
    expect(f).toMatchObject({ estado: "delivered", conductor: "3", desde: "2026-10-01", hasta: "", orden: "closedAt", dir: "desc", pagina: 1, filas: 10 });
    expect(url.leerFiltrosHistorial(new URLSearchParams("estado=in_transit")).estado).toBe("all");
  });

  it("escribe solo lo que cambia y conserva parámetros ajenos", () => {
    const params = url.escribirFiltrosHistorial({ ...url.FILTROS_HISTORIAL_INICIALES, placa: "2345", pagina: 3 }, new URLSearchParams("otro=1"));
    expect(params.toString()).toBe("otro=1&placa=2345&pagina=3");
    const ordenado = url.escribirFiltrosHistorial({ ...url.FILTROS_HISTORIAL_INICIALES, orden: "recipient", dir: "asc" });
    expect(ordenado.toString()).toBe("orden=recipient");
    expect(url.leerFiltrosHistorial(ordenado)).toMatchObject({ orden: "recipient", dir: "asc" });
  });

  it("arma los parámetros del back y detecta el rango al revés", () => {
    const f = { ...url.FILTROS_HISTORIAL_INICIALES, conductor: "3" as const, estado: "returned" as const, desde: "2026-10-01", hasta: "2026-10-31" };
    expect(url.paramsHistorial(f)).toEqual({
      page: 1, limit: 10, from: "2026-10-01", to: "2026-10-31", driverId: 3, plate: undefined, status: "returned", search: undefined, sortBy: "closedAt", order: "desc",
    });
    expect(url.rangoInvertido({ desde: "2026-10-10", hasta: "2026-10-01" })).toBe(true);
    expect(url.rangoInvertido({ desde: "2026-10-10", hasta: "" })).toBe(false);
  });

  it("toma el nombre del CSV del encabezado Content-Disposition", () => {
    expect(nombreArchivoCsv('attachment; filename="historial-despachos-2026-10-19.csv"')).toBe("historial-despachos-2026-10-19.csv");
    // 19/10/2026 01:00 UTC todavía es 18/10 en Bolivia.
    expect(nombreArchivoCsv(undefined, new Date("2026-10-19T01:00:00Z"))).toBe("historial-despachos-2026-10-18.csv");
  });
});

describe("pantalla del historial (ST-55.1)", () => {
  it("lista con los filtros de la URL y cada código lleva a la ficha 360°", async () => {
    abrir("?estado=delivered&pagina=2");
    const enlace = await screen.findByRole("link", { name: "Ver ficha de DSP-2026-00007" });
    expect(enlace.getAttribute("href")).toBe("/app/despachos/7");
    expect(ultimaConsulta()).toMatchObject({ status: "delivered", page: 2, limit: 10, sortBy: "closedAt", order: "desc" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Juan Rojas")).toBeTruthy();
    expect(within(filas[1]).getByText("Entregado")).toBeTruthy();
    expect(within(filas[2]).getByText("Sin asignar")).toBeTruthy();
    expect(within(filas[2]).getByText("Cancelado")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /Cierre/ }).getAttribute("aria-sort")).toBe("descending");
  });

  it("ordena en el servidor al tocar una columna y vuelve a la página 1", async () => {
    const usuario = userEvent.setup();
    abrir("?pagina=3");
    await screen.findByRole("link", { name: /DSP-2026-00007/ });
    await usuario.click(screen.getByRole("button", { name: /Cliente/ }));
    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ sortBy: "recipient", order: "asc", page: 1 }));
    expect(ruta.search).toBe("?orden=recipient");
    await usuario.click(screen.getByRole("button", { name: /Cliente/ }));
    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ sortBy: "recipient", order: "desc" }));
  });

  it("combina filtros y la placa espera a que termines de escribir", async () => {
    const usuario = userEvent.setup();
    abrir();
    await screen.findByRole("link", { name: /DSP-2026-00007/ });
    await usuario.selectOptions(screen.getByLabelText("Repartidor"), "3");
    await usuario.selectOptions(screen.getByLabelText("Estado final"), "not_delivered");
    await usuario.type(screen.getByLabelText("Vehículo (placa)"), "2345");
    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ driverId: 3, status: "not_delivered", plate: "2345" }));
    const consultasConPlacaParcial = get.mock.calls.filter(([, c]) => (c as { params?: { plate?: string } })?.params?.plate === "23");
    expect(consultasConPlacaParcial).toHaveLength(0);
    expect(ruta.search).toContain("conductor=3");
  });

  it("con rango al revés avisa y no consulta al back", async () => {
    abrir("?desde=2026-10-10&hasta=2026-10-01");
    expect(screen.getByRole("alert").textContent).toContain("no puede ser posterior");
    expect(screen.getByRole("button", { name: "Exportar CSV" }).hasAttribute("disabled")).toBe(true);
    expect(get.mock.calls.filter(([ruta]) => ruta === "/dispatches/history")).toHaveLength(0);
  });

  it("sin coincidencias ofrece limpiar los filtros", async () => {
    lista = { data: [], total: 0 };
    const usuario = userEvent.setup();
    abrir("?estado=returned&orden=plate");
    await screen.findByText("Ningún despacho coincide");
    await usuario.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(ruta.search).toBe("?orden=plate"));
  });

  it("sin historial muestra el vacío explicado y no deja exportar", async () => {
    lista = { data: [], total: 0 };
    abrir();
    await screen.findByText("Todavía no hay despachos finalizados");
    expect(screen.getByRole("button", { name: "Exportar CSV" }).hasAttribute("disabled")).toBe(true);
  });

  it("si el back falla muestra el error con reintento", async () => {
    get.mockRejectedValue(new Error("caído"));
    abrir();
    await screen.findByText("No pudimos cargar el historial");
  });

  it("exporta el CSV con los mismos filtros y orden de la pantalla", async () => {
    const crear = vi.fn(() => "blob:x");
    const revocar = vi.fn();
    Object.assign(URL, { createObjectURL: crear, revokeObjectURL: revocar });
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const usuario = userEvent.setup();
    abrir("?estado=delivered&orden=driver&dir=desc");
    await screen.findByRole("link", { name: /DSP-2026-00007/ });
    await usuario.click(screen.getByRole("button", { name: "Exportar CSV" }));
    await waitFor(() => expect(clic).toHaveBeenCalled());
    const [, config] = get.mock.calls.find(([ruta]) => ruta === "/dispatches/history/export") as [string, { params: object; responseType: string }];
    expect(config.responseType).toBe("blob");
    expect(config.params).toMatchObject({ status: "delivered", sortBy: "driver", order: "desc" });
    expect(crear).toHaveBeenCalled();
    expect(revocar).toHaveBeenCalledWith("blob:x");
  });
});
