// @vitest-environment jsdom
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Recojo } from "@/domains/despachos";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
// Leaflet necesita medir el DOM y descargar mosaicos: en las pruebas el mapa es un botón que marca un punto.
vi.mock("@/domains/despachos/components/punto-recojo-mapa", () => ({
  default: ({ onElegir }: { onElegir: (lat: number, lng: number) => void }) => (
    <button type="button" onClick={() => onElegir(-16.5123456, -68.1234567)}>Marcar en el mapa</button>
  ),
}));
const { default: api } = await import("@/shared/lib/axios");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
const despachos = await import("@/domains/despachos");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: RecojosPage } = await import("@/pages/dashboard/recojos-page");

const recojo = (r: Partial<Recojo> & Pick<Recojo, "id">): Recojo => ({
  trackingCode: `DSP-2026-0010${r.id}`, sourceOrderRef: `RMA-${r.id}`, origin: "rma", status: "pickup_scheduled",
  contactName: "Lucía Mamani", contactPhone: "+591 70000000", contactEmail: null, address: "Av. Arce 123",
  reference: null, latitude: -16.5, longitude: -68.13, returnReason: "Talla equivocada", packageContents: "Zapatillas",
  estimatedBoxes: 1, preferredPickupDate: "2026-11-10", destinationWarehouse: { id: 1, code: "WH-LPZ-01", name: "Central" },
  createdAt: "2026-11-08T12:00:00.000Z", ...r,
});
const PROGRAMADO = recojo({ id: 1 });
const MANUAL_EN_PLANIFICACION = recojo({ id: 2, origin: "manual", sourceOrderRef: "MAN-2", status: "in_planning", contactName: "Pedro Rojas" });
const ASIGNADO = recojo({ id: 3, status: "assigned", contactName: "Ana Quispe" });
const ALMACENES = [{ id: 1, code: "WH-LPZ-01", name: "Central", address: "Calle 1", active: true }];

function errorHttp(status: number, code: string) {
  const config = { url: "/pickup-orders", headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, {
    status, statusText: "", data: { statusCode: status, error: code, message: "x" }, headers: {}, config,
  });
}

let get: ReturnType<typeof vi.fn>;
let post: ReturnType<typeof vi.fn>;
let patch: ReturnType<typeof vi.fn>;
const pedidosListado = () => get.mock.calls.filter(([ruta]) => ruta === "/pickup-orders").map(([, config]) => config.params);
const usuario = (rolId: number) => useAuthStore.setState({ user: { id: 1, rol: { id: rolId, nombre: "x" } } as never });

beforeAll(() => {
  // Solo se congela la fecha: «hoy» es el 8 de noviembre de 2026 en Bolivia.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-08T15:00:00Z"));
});
afterAll(() => vi.useRealTimers());

beforeEach(() => {
  usuario(1);
  get = vi.fn(async (ruta: string) => {
    if (ruta === "/pickup-orders") return { data: { data: [PROGRAMADO, MANUAL_EN_PLANIFICACION, ASIGNADO], meta: { page: 1, limit: 10, pages: 1, total: 3 } } };
    if (ruta === "/warehouses") return { data: { data: ALMACENES, meta: { page: 1, limit: 100, pages: 1, total: 1 } } };
    throw new Error(`GET inesperado: ${ruta}`);
  });
  post = vi.fn(async (_ruta: string, cuerpo: object) => ({ data: { ...PROGRAMADO, ...cuerpo, id: 9, trackingCode: "DSP-2026-00109", origin: "manual" } }));
  patch = vi.fn(async () => ({ data: { ...PROGRAMADO, status: "cancelled" } }));
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
  const { search } = useLocation();
  return <output data-testid="ubicacion">{search}</output>;
}

function abrir(ruta = "/app/recojos") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <RecojosPage />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ResponsiveList dibuja la tabla y las tarjetas a la vez (el CSS elige cuál se ve): se usa la tabla.
const tabla = () => within(screen.getAllByRole("table")[0]);

describe("reglas de los recojos (ST-81.1)", () => {
  it("lee los filtros de la URL, ignora lo inválido y arma los parámetros del back", () => {
    const filtros = despachos.leerFiltrosRecojos(new URLSearchParams("estado=in_planning&origen=rma&desde=2026-11-01&hasta=2026-11-30&pagina=2"));
    expect(despachos.paramsRecojos(filtros)).toEqual({ page: 2, limit: 10, status: "in_planning", origin: "rma", from: "2026-11-01", to: "2026-11-30" });
    const invalidos = despachos.leerFiltrosRecojos(new URLSearchParams("estado=volando&origen=fax&desde=ayer&pagina=-1"));
    expect(despachos.paramsRecojos(invalidos)).toEqual({ page: 1, limit: 10 });
    expect(despachos.rangoRecojosInvertido({ desde: "2026-11-10", hasta: "2026-11-01" })).toBe(true);
  });

  it("solo deja anular antes de que salga la ruta y traduce los errores del back", () => {
    expect(["pickup_scheduled", "address_review", "in_planning"].every(despachos.sePuedeAnular)).toBe(true);
    expect(["scheduled", "assigned", "picked_up_in_transit", "cancelled"].some(despachos.sePuedeAnular)).toBe(false);
    expect(despachos.errorRecojo(errorHttp(422, "WAREHOUSE_NOT_AVAILABLE")).campo).toBe("warehouseCode");
    expect(despachos.errorRecojo(errorHttp(400, "PICKUP_DATE_IN_PAST")).campo).toBe("preferredPickupDate");
    expect(despachos.errorRecojo(errorHttp(409, "DISPATCH_CANCEL_NOT_ALLOWED"))).toMatchObject({ recargar: true });
  });
});

describe("validaciones del formulario de recojo (ST-81.1)", () => {
  const valido = {
    ...despachos.RECOJO_FORM_VACIO, warehouseCode: "WH-LPZ-01", contactName: "Lucía", contactPhone: "+591 (2) 222-3333",
    address: "Av. Arce 123", latitude: "-16.5", longitude: "-68.13", preferredPickupDate: "2026-11-08",
    packageContents: "Zapatillas", returnReason: "Talla equivocada",
  };
  const errores = (cambios: object) => {
    const r = despachos.crearRecojoSchema("2026-11-08").safeParse({ ...valido, ...cambios });
    return r.success ? {} : r.error.flatten().fieldErrors;
  };

  it("acepta lo mismo que el back y rechaza teléfono, correo, fecha pasada, coordenadas y cajas inválidas", () => {
    expect(errores({})).toEqual({});
    expect(errores({ contactPhone: "123" }).contactPhone).toBeTruthy();
    expect(errores({ contactPhone: "70abc000" }).contactPhone).toBeTruthy();
    expect(errores({ contactEmail: "no-es-correo" }).contactEmail).toBeTruthy();
    expect(errores({ preferredPickupDate: "2026-11-07" }).preferredPickupDate).toEqual(["La fecha no puede ser anterior a hoy."]);
    expect(errores({ latitude: "" }).latitude).toEqual(["Marca el punto en el mapa."]);
    expect(errores({ longitude: "-200" }).longitude).toBeTruthy();
    expect(errores({ estimatedBoxes: "0" }).estimatedBoxes).toBeTruthy();
    expect(errores({ estimatedBoxes: "1001" }).estimatedBoxes).toBeTruthy();
    expect(errores({ address: "x".repeat(301) }).address).toBeTruthy();
  });

  it("convierte al cuerpo del POST: números y opcionales vacíos como null", () => {
    expect(despachos.aCrearRecojoInput({ ...valido, estimatedBoxes: "3", contactEmail: "  " })).toEqual({
      warehouseCode: "WH-LPZ-01", contactName: "Lucía", contactPhone: "+591 (2) 222-3333", contactEmail: null,
      address: "Av. Arce 123", reference: null, latitude: -16.5, longitude: -68.13, preferredPickupDate: "2026-11-08",
      packageContents: "Zapatillas", estimatedBoxes: 3, returnReason: "Talla equivocada", rmaId: null,
    });
  });
});

describe("página de recojos (ST-81.1)", () => {
  it("lista los recojos con su origen y solo ofrece «Anular» donde el back lo permite", async () => {
    abrir();
    await screen.findAllByText("Lucía Mamani");
    expect(pedidosListado()[0]).toEqual({ page: 1, limit: 10 });
    expect(tabla().getAllByText("RMA")).toHaveLength(2);
    expect(tabla().getByText("Manual")).toBeTruthy();
    expect(tabla().getByText("Recojo programado")).toBeTruthy();
    expect(tabla().getByRole("button", { name: "Anular el recojo DSP-2026-00101" })).toBeTruthy();
    expect(tabla().getByRole("button", { name: "Anular el recojo DSP-2026-00102" })).toBeTruthy();
    expect(tabla().queryByRole("button", { name: "Anular el recojo DSP-2026-00103" })).toBeNull();
  });

  it("filtra por estado y origen, y lo deja en la URL", async () => {
    const user = userEvent.setup();
    abrir("/app/recojos?pagina=2");
    await screen.findAllByText("Lucía Mamani");
    await user.selectOptions(screen.getByLabelText("Estado"), "cancelled");
    await waitFor(() => expect(pedidosListado().at(-1)).toEqual({ page: 1, limit: 10, status: "cancelled" }));
    await user.selectOptions(screen.getByLabelText("Origen"), "manual");
    await waitFor(() => expect(pedidosListado().at(-1)).toEqual({ page: 1, limit: 10, status: "cancelled", origin: "manual" }));
    expect(screen.getByTestId("ubicacion").textContent).toBe("?estado=cancelled&origen=manual");
  });

  it("con el rango de fechas al revés avisa y no consulta al back", async () => {
    abrir("/app/recojos?desde=2026-11-20&hasta=2026-11-01");
    expect(await screen.findByText(/no puede ser posterior/)).toBeTruthy();
    expect(pedidosListado()).toHaveLength(0);
  });

  it("registra un recojo: valida, marca el punto en el mapa y manda el cuerpo limpio", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("Lucía Mamani");
    await user.click(screen.getByRole("button", { name: "Nuevo recojo" }));
    const dialogo = within(await screen.findByRole("dialog"));
    await dialogo.findByRole("option", { name: "WH-LPZ-01 · Central" });

    await user.click(dialogo.getByRole("button", { name: "Registrar recojo" }));
    expect(await dialogo.findByText("Escribe el nombre de quien entrega.")).toBeTruthy();
    expect(dialogo.getAllByText("Marca el punto en el mapa.")).toHaveLength(2);
    expect(dialogo.getByText("Elige el almacén de destino.")).toBeTruthy();
    expect(post).not.toHaveBeenCalled();

    await user.type(dialogo.getByLabelText("Nombre de quien entrega"), "  Carla Rojas ");
    await user.type(dialogo.getByLabelText("Teléfono"), "+591 71234567");
    await user.type(dialogo.getByLabelText("Dirección"), "Calle 21 de Calacoto");
    await user.click(await dialogo.findByRole("button", { name: "Marcar en el mapa" }));
    expect((dialogo.getByLabelText("Latitud") as HTMLInputElement).value).toBe("-16.512346");
    expect((dialogo.getByLabelText("Longitud") as HTMLInputElement).value).toBe("-68.123457");
    await user.selectOptions(dialogo.getByLabelText("Almacén de destino"), "WH-LPZ-01");
    fireEvent.change(dialogo.getByLabelText("Fecha preferida"), { target: { value: "2026-11-10" } });
    await user.type(dialogo.getByLabelText("Qué se recoge"), "Licuadora");
    await user.type(dialogo.getByLabelText("Motivo de la devolución"), "Llegó con fallas");
    await user.type(dialogo.getByLabelText("Cajas estimadas (opcional)"), "2");
    await user.click(dialogo.getByRole("button", { name: "Registrar recojo" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/pickup-orders", {
      warehouseCode: "WH-LPZ-01", contactName: "Carla Rojas", contactPhone: "+591 71234567", contactEmail: null,
      address: "Calle 21 de Calacoto", reference: null, latitude: -16.512346, longitude: -68.123457,
      preferredPickupDate: "2026-11-10", packageContents: "Licuadora", estimatedBoxes: 2, returnReason: "Llegó con fallas", rmaId: null,
    }, expect.anything()));
    expect(toast.success).toHaveBeenCalledWith("Recojo DSP-2026-00109 registrado.");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("si el almacén ya no está activo, el error sale bajo ese campo", async () => {
    post.mockRejectedValueOnce(errorHttp(422, "WAREHOUSE_NOT_AVAILABLE"));
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("Lucía Mamani");
    await user.click(screen.getByRole("button", { name: "Nuevo recojo" }));
    const dialogo = within(await screen.findByRole("dialog"));
    await dialogo.findByRole("option", { name: "WH-LPZ-01 · Central" });
    await user.type(dialogo.getByLabelText("Nombre de quien entrega"), "Carla");
    await user.type(dialogo.getByLabelText("Teléfono"), "71234567");
    await user.type(dialogo.getByLabelText("Dirección"), "Calle 21");
    await user.click(await dialogo.findByRole("button", { name: "Marcar en el mapa" }));
    await user.selectOptions(dialogo.getByLabelText("Almacén de destino"), "WH-LPZ-01");
    fireEvent.change(dialogo.getByLabelText("Fecha preferida"), { target: { value: "2026-11-10" } });
    await user.type(dialogo.getByLabelText("Qué se recoge"), "Licuadora");
    await user.type(dialogo.getByLabelText("Motivo de la devolución"), "Fallas");
    await user.click(dialogo.getByRole("button", { name: "Registrar recojo" }));
    expect(await dialogo.findByText("Ese almacén no existe o ya no está activo. Elige otro.")).toBeTruthy();
    expect(dialogo.getByLabelText("Almacén de destino").getAttribute("aria-invalid")).toBe("true");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("anular pide el motivo y lo manda; sin motivo no llama al back", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("Lucía Mamani");
    await user.click(tabla().getByRole("button", { name: "Anular el recojo DSP-2026-00102" }));
    const dialogo = within(await screen.findByRole("dialog"));
    await user.click(dialogo.getByRole("button", { name: "Anular recojo" }));
    expect(dialogo.getByText("Escribe por qué se anula el recojo.")).toBeTruthy();
    expect(patch).not.toHaveBeenCalled();
    await user.type(dialogo.getByLabelText("Motivo"), "  El cliente desistió  ");
    await user.click(dialogo.getByRole("button", { name: "Anular recojo" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/pickup-orders/2/cancel", { reason: "El cliente desistió" }, expect.anything()));
    expect(toast.success).toHaveBeenCalledWith("Recojo anulado.");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("si la ruta ya salió (409), muestra el aviso en el diálogo y recarga la lista", async () => {
    patch.mockRejectedValueOnce(errorHttp(409, "DISPATCH_CANCEL_NOT_ALLOWED"));
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("Lucía Mamani");
    await user.click(tabla().getByRole("button", { name: "Anular el recojo DSP-2026-00101" }));
    const dialogo = within(await screen.findByRole("dialog"));
    await user.type(dialogo.getByLabelText("Motivo"), "Ya no se necesita");
    await user.click(dialogo.getByRole("button", { name: "Anular recojo" }));
    expect(await dialogo.findByText(/ya no se puede anular/)).toBeTruthy();
    await waitFor(() => expect(pedidosListado()).toHaveLength(2));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("quien no es coordinador ve el listado en solo lectura", async () => {
    usuario(2);
    abrir();
    await screen.findAllByText("Lucía Mamani");
    expect(screen.queryByRole("button", { name: "Nuevo recojo" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Anular el recojo/ })).toBeNull();
  });
});
