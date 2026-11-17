// @vitest-environment jsdom
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Mantenimiento, Vehiculo } from "@/domains/flota";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const { default: api } = await import("@/shared/lib/axios");
const { VehiculosTable } = await import("@/domains/flota");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/flota/flota.mantenimiento");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: FlotaMantenimientoPage } = await import("@/pages/dashboard/flota-mantenimiento-page");

const VEHICULO_7 = { id: 7, plate: "1234-ABC", model: "Toyota Hilux 2022" };
const VEHICULO_8 = { id: 8, plate: "5678-XYZ", model: "Nissan Frontier" };
const FRENOS = { id: 3, code: "MEC-FRE-01", name: "Falla en frenos" };

const mantenimiento = (m: Partial<Mantenimiento> & Pick<Mantenimiento, "id">): Mantenimiento => ({
  vehicleId: 7, vehicle: VEHICULO_7, vehicleIncidentTypeId: 3, vehicleIncidentType: FRENOS,
  maintenanceType: "corrective", description: "Ruido metálico en las pastillas", status: "pending",
  scheduledAt: null, completedAt: null, createdAt: "2026-11-05T14:00:00.000Z", ...m,
});
const PENDIENTE = mantenimiento({ id: 1 });
const EN_CURSO = mantenimiento({ id: 2, vehicleId: 8, vehicle: VEHICULO_8, description: "Cambio de aceite", status: "in_progress" });
const COMPLETADO = mantenimiento({
  id: 3, vehicleIncidentTypeId: null, vehicleIncidentType: null, maintenanceType: "preventive",
  description: "Revisión de los 10.000 km", status: "completed", completedAt: "2026-11-03T20:30:00.000Z",
});

const vehiculo = (v: typeof VEHICULO_7): Vehiculo => ({
  ...v, type: "Camioneta", capacityKg: 800, capacityM3: 3, vehicleStatus: { id: 1, name: "active" }, createdAt: "2026-01-01T00:00:00.000Z",
});
const pagina = <T,>(data: T[]) => ({ data, meta: { page: 1, limit: 10, pages: 1, total: data.length } });

function errorHttp(status: number, data: unknown) {
  const config = { url: "/vehicle-maintenances", headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, { status, statusText: "", data, headers: {}, config });
}

let get: ReturnType<typeof vi.fn>;
let post: ReturnType<typeof vi.fn>;
let patch: ReturnType<typeof vi.fn>;
const pedidosHistorial = () => get.mock.calls.filter(([ruta]) => ruta === "/vehicle-maintenances").map(([, config]) => config.params);

beforeEach(() => {
  get = vi.fn(async (ruta: string) => {
    if (ruta === "/vehicle-maintenances") return { data: pagina([EN_CURSO, PENDIENTE, COMPLETADO]) };
    if (ruta === "/vehicles") return { data: pagina([vehiculo(VEHICULO_7), vehiculo(VEHICULO_8)]) };
    if (ruta === "/vehicle-incident-types") {
      return { data: pagina([{ ...FRENOS, severity: "critical", disablesVehicle: true, createdAt: "2026-01-01T00:00:00.000Z" }]) };
    }
    throw new Error(`GET inesperado: ${ruta}`);
  });
  post = vi.fn(async (_ruta: string, cuerpo: object) => ({
    data: { id: 9, ...cuerpo, status: "pending", scheduledAt: null, completedAt: null, createdAt: "2026-11-08T12:00:00.000Z", vehicleStatus: "maintenance" },
  }));
  patch = vi.fn(async (ruta: string, cuerpo: { status: string }) => ({
    data: { ...EN_CURSO, id: Number(ruta.split("/")[2]), status: cuerpo.status, completedAt: "2026-11-08T12:00:00.000Z", vehicleStatus: "active" },
  }));
  vi.spyOn(api, "get").mockImplementation(get as never);
  vi.spyOn(api, "post").mockImplementation(post as never);
  vi.spyOn(api, "patch").mockImplementation(patch as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toast.success.mockClear();
});

function Ubicacion() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacion">{pathname}{search}</output>;
}

function abrir(ruta = "/app/flota/mantenimiento") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/app/flota/mantenimiento" element={<FlotaMantenimientoPage />} />
          <Route path="/app/flota/:id/mantenimiento" element={<FlotaMantenimientoPage />} />
        </Routes>
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ResponsiveList dibuja la tabla y las tarjetas a la vez (el CSS elige cuál se ve): se usa la primera.
const primero = <T,>(lista: T[]) => lista[0];

describe("reglas del historial de mantenimientos (ST-64.2)", () => {
  it("lee los filtros de la URL, ignora lo inválido y arma los parámetros del back", () => {
    const filtros = reglas.leerFiltrosMantenimiento(new URLSearchParams("vehiculo=7&estado=in_progress&desde=2026-11-01&hasta=2026-11-30&pagina=2"));
    expect(filtros).toEqual({ vehiculoId: 7, estado: "in_progress", desde: "2026-11-01", hasta: "2026-11-30", pagina: 2 });
    expect(reglas.paramsMantenimiento(filtros)).toEqual({ page: 2, limit: 10, vehicleId: 7, status: "in_progress", from: "2026-11-01", to: "2026-11-30" });
    const invalidos = reglas.leerFiltrosMantenimiento(new URLSearchParams("vehiculo=abc&estado=roto&desde=ayer&pagina=0"));
    expect(invalidos).toEqual({ vehiculoId: null, estado: null, desde: "", hasta: "", pagina: 1 });
    expect(reglas.paramsMantenimiento(invalidos)).toEqual({ page: 1, limit: 10 });
  });

  it("escribe en la URL solo los filtros con valor", () => {
    const url = reglas.escribirFiltrosMantenimiento(
      { vehiculoId: null, estado: "pending", desde: "", hasta: "2026-11-30", pagina: 1 },
      new URLSearchParams("vehiculo=7&desde=2026-11-01&pagina=3"),
    );
    expect(url.toString()).toBe("estado=pending&hasta=2026-11-30");
  });

  it("solo permite avanzar un paso y detecta el rango al revés", () => {
    expect(reglas.siguienteEstado("pending")).toBe("in_progress");
    expect(reglas.siguienteEstado("in_progress")).toBe("completed");
    expect(reglas.siguienteEstado("completed")).toBeNull();
    expect(reglas.rangoInvertido({ desde: "2026-11-10", hasta: "2026-11-01" })).toBe(true);
    expect(reglas.rangoInvertido({ desde: "2026-11-01", hasta: "2026-11-01" })).toBe(false);
    expect(reglas.rangoInvertido({ desde: "2026-11-01", hasta: "" })).toBe(false);
  });

  it("traduce los errores del back por su código", () => {
    expect(reglas.errorMantenimiento(errorHttp(409, {
      statusCode: 409, error: "VEHICLE_HAS_ACTIVE_BATCHES", message: "x", details: { batches: [{ id: 42, shiftDate: "2026-11-09" }] },
    }))).toEqual({ mensaje: expect.stringMatching(/lotes confirmados o en ruta/), lotes: [{ id: 42, shiftDate: "2026-11-09" }] });
    expect(reglas.errorMantenimiento(errorHttp(409, { statusCode: 409, error: "INVALID_MAINTENANCE_TRANSITION", message: "x" })).mensaje)
      .toMatch(/ya cambió de estado/);
    expect(reglas.errorMantenimiento(errorHttp(403, { statusCode: 403, error: "INSUFFICIENT_PERMISSIONS", message: "x" })).mensaje)
      .toMatch(/supervisor o el coordinador/);
  });
});

describe("historial de mantenimientos (ST-64.2)", () => {
  it("lista toda la flota con tipo, estado, fechas y la acción del siguiente paso", async () => {
    abrir();
    // Primero los datos: mientras carga, la tabla es otra (el esqueleto).
    await screen.findAllByText("Cambio de aceite");
    const tabla = within(primero(screen.getAllByRole("table")));
    expect(tabla.getByText("Cambio de aceite")).toBeTruthy();
    expect(pedidosHistorial()[0]).toEqual({ page: 1, limit: 10 });
    expect(tabla.getAllByText("Correctivo")).toHaveLength(2);
    expect(tabla.getByText("Preventivo")).toBeTruthy();
    // Los dos correctivos vienen de «Falla en frenos»; el preventivo no tiene tipo de incidente.
    expect(tabla.getAllByText("Falla en frenos")).toHaveLength(2);
    expect(tabla.getByText("Pendiente")).toBeTruthy();
    expect(tabla.getByText("En curso")).toBeTruthy();
    expect(tabla.getByText("Completado")).toBeTruthy();
    expect(tabla.getByRole("button", { name: "Iniciar mantenimiento de 1234-ABC" })).toBeTruthy();
    expect(tabla.getByRole("button", { name: "Completar mantenimiento de 5678-XYZ" })).toBeTruthy();
    // El completado no tiene acción y muestra su fecha de cierre (hora de Bolivia).
    expect(tabla.getAllByRole("button", { name: /mantenimiento de/ })).toHaveLength(2);
    expect(tabla.getAllByText(/^Cierre: \d/)).toHaveLength(1);
  });

  it("desde un vehículo abre el historial con ese vehículo filtrado", async () => {
    abrir("/app/flota/7/mantenimiento");
    await waitFor(() => expect(screen.getByTestId("ubicacion").textContent).toBe("/app/flota/mantenimiento?vehiculo=7"));
    await waitFor(() => expect(pedidosHistorial().at(-1)).toEqual({ page: 1, limit: 10, vehicleId: 7 }));
    await waitFor(() => expect((screen.getByLabelText("Vehículo") as HTMLSelectElement).value).toBe("7"));
  });

  it("filtra por estado y fechas, y vuelve a la página 1", async () => {
    const user = userEvent.setup();
    abrir("/app/flota/mantenimiento?pagina=2");
    await screen.findAllByText("Cambio de aceite");
    await user.selectOptions(screen.getByLabelText("Estado"), "pending");
    await waitFor(() => expect(pedidosHistorial().at(-1)).toEqual({ page: 1, limit: 10, status: "pending" }));
    expect(screen.getByTestId("ubicacion").textContent).toBe("/app/flota/mantenimiento?estado=pending");
    await user.type(screen.getByLabelText("Registrado desde"), "2026-11-01");
    await waitFor(() => expect(pedidosHistorial().at(-1)).toEqual({ page: 1, limit: 10, status: "pending", from: "2026-11-01" }));
  });

  it("con el rango de fechas al revés muestra el error y no consulta al back", async () => {
    abrir("/app/flota/mantenimiento?desde=2026-11-10&hasta=2026-11-01");
    expect(await screen.findByText(/no puede ser posterior/)).toBeTruthy();
    expect(pedidosHistorial()).toHaveLength(0);
  });

  it("completar pide confirmación, cierra el mantenimiento y avisa que el vehículo volvió a estar disponible", async () => {
    const user = userEvent.setup();
    abrir();
    await user.click(primero(await screen.findAllByRole("button", { name: "Completar mantenimiento de 5678-XYZ" })));
    const dialogo = within(await screen.findByRole("dialog"));
    expect(dialogo.getByText(/vuelve a estar disponible/)).toBeTruthy();
    await user.click(dialogo.getByRole("button", { name: "Completar" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/vehicle-maintenances/2/status", { status: "completed" }, expect.anything()));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Mantenimiento completado. El vehículo volvió a estar disponible."));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("iniciar pasa el mantenimiento a «En curso»", async () => {
    const user = userEvent.setup();
    abrir();
    await user.click(primero(await screen.findAllByRole("button", { name: "Iniciar mantenimiento de 1234-ABC" })));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Iniciar" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/vehicle-maintenances/1/status", { status: "in_progress" }, expect.anything()));
    expect(toast.success).toHaveBeenCalledWith("Mantenimiento iniciado.");
  });

  it("si otro ya cambió el mantenimiento, muestra el error en el diálogo y no lo cierra", async () => {
    patch.mockRejectedValueOnce(errorHttp(409, { statusCode: 409, error: "INVALID_MAINTENANCE_TRANSITION", message: "x" }));
    const user = userEvent.setup();
    abrir();
    await user.click(primero(await screen.findAllByRole("button", { name: "Iniciar mantenimiento de 1234-ABC" })));
    const dialogo = within(await screen.findByRole("dialog"));
    await user.click(dialogo.getByRole("button", { name: "Iniciar" }));
    expect(await dialogo.findByText(/ya cambió de estado/)).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("registra una incidencia con el vehículo del filtro y valida los campos", async () => {
    const user = userEvent.setup();
    abrir("/app/flota/mantenimiento?vehiculo=7");
    await screen.findAllByText("Cambio de aceite");
    await user.click(screen.getByRole("button", { name: "Registrar incidencia" }));
    const dialogo = within(await screen.findByRole("dialog"));
    await dialogo.findByRole("option", { name: "MEC-FRE-01 · Falla en frenos" });
    expect((dialogo.getByLabelText("Vehículo") as HTMLSelectElement).value).toBe("7");

    await user.click(dialogo.getByRole("button", { name: "Registrar incidencia" }));
    expect(await dialogo.findByText("Elige el tipo de incidente")).toBeTruthy();
    expect(dialogo.getByText("Describe qué pasó con el vehículo")).toBeTruthy();
    expect(post).not.toHaveBeenCalled();

    await user.selectOptions(dialogo.getByLabelText("Tipo de incidente"), "3");
    expect(dialogo.getByText(/deja el vehículo en mantenimiento/)).toBeTruthy();
    await user.type(dialogo.getByLabelText("Qué pasó"), "  Frenos sin respuesta  ");
    await user.click(dialogo.getByRole("button", { name: "Registrar incidencia" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/vehicle-maintenances",
      { vehicleId: 7, vehicleIncidentTypeId: 3, description: "Frenos sin respuesta" },
      expect.anything(),
    ));
    expect(toast.success).toHaveBeenCalledWith("Incidencia registrada. El vehículo pasó a mantenimiento.");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("si el vehículo tiene lotes activos, muestra los lotes con el enlace para cambiar el vehículo", async () => {
    post.mockRejectedValueOnce(errorHttp(409, {
      statusCode: 409, error: "VEHICLE_HAS_ACTIVE_BATCHES", message: "x", details: { batches: [{ id: 42, shiftDate: "2026-11-09" }] },
    }));
    const user = userEvent.setup();
    abrir("/app/flota/mantenimiento?vehiculo=7");
    await screen.findAllByText("Cambio de aceite");
    await user.click(screen.getByRole("button", { name: "Registrar incidencia" }));
    const dialogo = within(await screen.findByRole("dialog"));
    await dialogo.findByRole("option", { name: "MEC-FRE-01 · Falla en frenos" });
    await user.selectOptions(dialogo.getByLabelText("Tipo de incidente"), "3");
    await user.type(dialogo.getByLabelText("Qué pasó"), "Frenos sin respuesta");
    await user.click(dialogo.getByRole("button", { name: "Registrar incidencia" }));
    expect(await dialogo.findByText(/Lote #42 · 2026-11-09/)).toBeTruthy();
    expect(dialogo.getByRole("link", { name: "Cambiar vehículo del lote" }).getAttribute("href"))
      .toBe("/app/planificacion?loteId=42&accion=cambiar-vehiculo");
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("acceso desde la tabla de vehículos (ST-64.2)", () => {
  it("cada vehículo tiene el botón «Mantenimientos» hacia su historial", () => {
    render(
      <MemoryRouter>
        <VehiculosTable data={[vehiculo(VEHICULO_7)]} onEdit={() => {}} onChangeStatus={() => {}}
          hrefMantenimientos={(v) => `/app/flota/${v.id}/mantenimiento`} />
      </MemoryRouter>,
    );
    const enlaces = screen.getAllByRole("link", { name: "Mantenimientos de 1234-ABC" });
    expect(enlaces[0].getAttribute("href")).toBe("/app/flota/7/mantenimiento");
  });

  it("sin el enlace, la tabla queda como antes", () => {
    render(
      <MemoryRouter>
        <VehiculosTable data={[vehiculo(VEHICULO_7)]} onEdit={() => {}} onChangeStatus={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: /Mantenimientos/ })).toBeNull();
  });
});
