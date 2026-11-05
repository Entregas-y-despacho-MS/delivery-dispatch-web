// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const toastExito = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastExito(m), error: (m: string) => toastError(m) } }));
const { default: api } = await import("@/shared/lib/axios");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el hook directamente.
const { useEnlaceSeguimiento, useSolicitudesCambio } = await import("@/domains/despachos/hooks/use-solicitudes-cambio");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el componente directamente.
const { SolicitudesCambioVista } = await import("@/domains/despachos/components/solicitudes-cambio-vista");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el componente directamente.
const { ResolverSolicitudDialog } = await import("@/domains/despachos/components/resolver-solicitud-dialog");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el componente directamente.
const { EnlaceSeguimientoDialog } = await import("@/domains/despachos/components/enlace-seguimiento-dialog");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas de la URL directamente.
const url = await import("@/domains/despachos/solicitudes-cambio.url");
import type { SolicitudCambio } from "@/domains/despachos";

const SOLICITUD: SolicitudCambio = {
  dispatchId: 7, trackingCode: "DSP-2026-00045", status: "scheduled", routeBatchId: 500, deliveryDate: "2026-10-21",
  windowStart: "2026-10-21T13:00:00.000Z", windowEnd: "2026-10-21T15:00:00.000Z", zoneId: 3, zoneName: "Zona Sur",
  contactName: "Ana Perez", hasContactEmail: false,
  request: { detail: "Estaré de viaje, después del 28 por favor.", requestedAt: "2026-10-19T14:00:00.000Z", responseWindowWasOpen: true, selfServiceClosedReason: null },
  promiseIsFirm: false, promiseFirmedAt: null, canRevealTrackingLink: true,
};
const CON_CORREO: SolicitudCambio = {
  ...SOLICITUD, dispatchId: 8, trackingCode: "DSP-2026-00046", contactName: "Luis Rojas", hasContactEmail: true,
  request: { ...SOLICITUD.request, detail: null }, promiseIsFirm: true, promiseFirmedAt: "2026-10-19T15:00:00.000Z", canRevealTrackingLink: false,
};
const DETALLE = {
  id: 7, trackingCode: "DSP-2026-00045", sourceOrderRef: "SO-7", type: { id: 1, name: "delivery" }, status: { id: 3, name: "scheduled" },
  priority: "normal", serviceLevel: null, evidencePolicy: "hand_delivery_standard", paymentStatusLabel: null,
  scheduledWindowStart: SOLICITUD.windowStart, scheduledWindowEnd: SOLICITUD.windowEnd, createdAt: "2026-10-15T10:00:00Z",
  destination: { address: "Calle 1", reference: null, latitude: null, longitude: null, contactName: "Ana Perez", contactPhone: null, zone: null },
  packages: [], route: null, receiver: null, timeline: [], incidents: [], reschedules: [], evidences: [],
};

let lista: SolicitudCambio[] = [];
const conflicto = (code: string) => Object.assign(new Error(code), {
  isAxiosError: true, response: { status: 409, data: { statusCode: 409, error: code, message: code } }, config: {},
});
let enlaceFalla: string | null = null;

beforeEach(() => {
  lista = [SOLICITUD, CON_CORREO];
  enlaceFalla = null;
  toastExito.mockReset();
  toastError.mockReset();
  vi.spyOn(api, "get").mockImplementation(async (ruta: string, config?: { params?: { page?: number } }) => {
    if (ruta === "/dispatches/7/detail") return { data: DETALLE };
    return { data: { data: lista, meta: { page: config?.params?.page ?? 1, limit: 10, total: lista.length, pages: 1 } } };
  });
  vi.spyOn(api, "post").mockImplementation(async (ruta: string) => {
    if (ruta.endsWith("/tracking-link")) {
      if (enlaceFalla) throw conflicto(enlaceFalla);
      return { data: { dispatchId: 7, trackingUrl: "https://flash.test/seguimiento/tok-secreto" } };
    }
    // POST /dispatches/7/reschedule: el back resuelve la solicitud y deja de listarla.
    lista = [CON_CORREO];
    return { data: { dispatchId: 7, attemptsUsed: 1, attemptsLimit: 3 } };
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

function Pantalla({ coordinador = true }: { coordinador?: boolean }) {
  const b = useSolicitudesCambio();
  const enlace = useEnlaceSeguimiento();
  const [resolviendo, setResolviendo] = useState<SolicitudCambio | null>(null);
  return (
    <>
      <button type="button" onClick={() => void b.refrescar()}>Refrescar</button>
      <SolicitudesCambioVista
        data={b.solicitudes.data} cargando={b.solicitudes.isLoading} error={b.solicitudes.isError ? b.solicitudes.error : undefined}
        onReintentar={b.refrescar} filtrada={b.hayFiltros} onLimpiarFiltros={b.limpiarFiltros}
        puedeResolver={coordinador} onResolver={setResolviendo} onMostrarEnlace={enlace.mostrar} pidiendoEnlaceId={enlace.pidiendoId}
        hrefFicha={(id) => `/app/despachos/${id}`}
      />
      <ResolverSolicitudDialog dispatchId={resolviendo?.dispatchId ?? null} trackingCode={resolviendo?.trackingCode} onCerrar={() => setResolviendo(null)}
        motivos={[{ code: "RES-CLI-SELF", name: "Pedido del cliente" }]} franjas={[{ inicio: "14:00", fin: "16:00" }]} limiteIntentos={3} />
      <EnlaceSeguimientoDialog enlace={enlace.pendienteDeCopiar} onCerrar={enlace.olvidar} />
      <Ubicacion />
    </>
  );
}

function abrir(busqueda = "", coordinador = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/app/solicitudes${busqueda}`]}><Pantalla coordinador={coordinador} /></MemoryRouter>
    </QueryClientProvider>,
  );
}

const tarjeta = (codigo: string) => screen.getByRole("listitem", { name: `Solicitud de ${codigo}` });

describe("filtros de la bandeja en la URL (ST-224.3)", () => {
  it("lee, ignora lo inválido y arma los parámetros del back", () => {
    const f = url.leerFiltrosSolicitudes(new URLSearchParams("zona=3&fecha=2026-02-31&buscar=ana&pagina=x"));
    expect(f).toEqual({ buscar: "ana", zona: "3", fecha: "", pagina: 1 });
    expect(url.paramsSolicitudes({ ...f, fecha: "2026-10-21" })).toEqual({ page: 1, limit: 10, delivery_zone_id: 3, date: "2026-10-21", search: "ana" });
    expect(url.escribirFiltrosSolicitudes({ ...url.FILTROS_SOLICITUDES_INICIALES, zona: "3", pagina: 2 }).toString()).toBe("zona=3&pagina=2");
  });
});

describe("bandeja de solicitudes de cambio (ST-224.3)", () => {
  it("muestra lo que pidió el cliente, avisa si la promesa no está en firme y lleva a la ficha", async () => {
    abrir("?zona=3");
    await screen.findByText("Estaré de viaje, después del 28 por favor.");
    const llamada = vi.mocked(api.get).mock.calls.find(([r]) => r === "/dispatches/change-requests");
    const config = llamada?.[1] as { params: object } | undefined;
    expect(config?.params).toMatchObject({ delivery_zone_id: 3, page: 1, limit: 10 });
    const primera = tarjeta("DSP-2026-00045");
    expect(within(primera).getByRole("note").textContent).toContain("no saldrá la orden de preparación");
    expect(within(primera).getByText("Sin correo")).toBeTruthy();
    expect(within(primera).getByRole("link", { name: "Ver ficha de DSP-2026-00045" }).getAttribute("href")).toBe("/app/despachos/7");
    const segunda = tarjeta("DSP-2026-00046");
    expect(within(segunda).queryByRole("note")).toBeNull();
    expect(within(segunda).getByText("El cliente no dejó un comentario.")).toBeTruthy();
  });

  it("«Mostrar enlace» solo aparece si el back lo permite y el supervisor no puede reprogramar", async () => {
    abrir("", false);
    await screen.findByText("Estaré de viaje, después del 28 por favor.");
    expect(within(tarjeta("DSP-2026-00045")).getByRole("button", { name: /Mostrar enlace/ })).toBeTruthy();
    expect(within(tarjeta("DSP-2026-00046")).queryByRole("button", { name: /Mostrar enlace/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Reprogramar/ })).toBeNull();
    expect(vi.mocked(api.post)).not.toHaveBeenCalled();
  });

  it("pide el enlace al hacer clic, lo copia y no lo deja en la URL ni en pantalla", async () => {
    const usuario = userEvent.setup();
    const escribir = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    abrir();
    await screen.findByText("Estaré de viaje, después del 28 por favor.");
    await usuario.click(within(tarjeta("DSP-2026-00045")).getByRole("button", { name: /Mostrar enlace/ }));
    await waitFor(() => expect(escribir).toHaveBeenCalledWith("https://flash.test/seguimiento/tok-secreto"));
    expect(vi.mocked(api.post)).toHaveBeenCalledWith("/dispatches/change-requests/7/tracking-link", undefined, { skipErrorToast: true });
    expect(toastExito).toHaveBeenCalledWith(expect.stringContaining("copiado"));
    expect(document.body.textContent).not.toContain("tok-secreto");
    expect(ruta.search).not.toContain("tok");
  });

  it("si el navegador no deja copiar, lo muestra una vez y lo olvida al cerrar", async () => {
    const usuario = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("sin permiso"));
    abrir();
    await screen.findByText("Estaré de viaje, después del 28 por favor.");
    await usuario.click(within(tarjeta("DSP-2026-00045")).getByRole("button", { name: /Mostrar enlace/ }));
    const campo = await screen.findByRole("textbox", { name: "Enlace de seguimiento" });
    expect((campo as HTMLInputElement).value).toBe("https://flash.test/seguimiento/tok-secreto");
    await usuario.click(screen.getByRole("button", { name: "Listo" }));
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Enlace de seguimiento" })).toBeNull());
  });

  it("si otro coordinador ya la resolvió, avisa y recarga la bandeja", async () => {
    const usuario = userEvent.setup();
    enlaceFalla = "CHANGE_REQUEST_NOT_PENDING";
    abrir();
    await screen.findByText("Estaré de viaje, después del 28 por favor.");
    lista = [CON_CORREO];
    await usuario.click(within(tarjeta("DSP-2026-00045")).getByRole("button", { name: /Mostrar enlace/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining("Otro coordinador ya resolvió")));
    await waitFor(() => expect(screen.queryByText("Estaré de viaje, después del 28 por favor.")).toBeNull());
  });

  it("resuelve reprogramando con el modal de la 52.1 y la solicitud sale de la lista", async () => {
    const usuario = userEvent.setup();
    abrir();
    await screen.findByText("Estaré de viaje, después del 28 por favor.");
    await usuario.click(within(tarjeta("DSP-2026-00045")).getByRole("button", { name: /Reprogramar/ }));
    const dialogo = await screen.findByRole("dialog");
    const formulario = await within(dialogo).findByRole("form", { name: "Datos de la reprogramación" });
    await usuario.clear(within(formulario).getByLabelText("Nueva fecha pactada"));
    // Siempre una fecha futura: el modal no deja reprogramar a un día anterior a hoy.
    const enUnaSemana = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await usuario.type(within(formulario).getByLabelText("Nueva fecha pactada"), enUnaSemana);
    await usuario.selectOptions(within(formulario).getByLabelText("Franja"), "14:00-16:00");
    await usuario.selectOptions(within(formulario).getByLabelText("Motivo"), "RES-CLI-SELF");
    await usuario.click(within(dialogo).getByRole("button", { name: /^Reprogramar/ }));
    await waitFor(() => expect(vi.mocked(api.post)).toHaveBeenCalledWith("/dispatches/7/reschedule", expect.objectContaining({ reasonCode: "RES-CLI-SELF" }), expect.anything()));
    await waitFor(() => expect(screen.queryByText("Estaré de viaje, después del 28 por favor.")).toBeNull());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("una solicitud resuelta por otro desaparece al refrescar", async () => {
    const usuario = userEvent.setup();
    abrir();
    await screen.findByText("Estaré de viaje, después del 28 por favor.");
    lista = [CON_CORREO];
    await usuario.click(screen.getByRole("button", { name: "Refrescar" }));
    await waitFor(() => expect(screen.queryByText("Estaré de viaje, después del 28 por favor.")).toBeNull());
    expect(tarjeta("DSP-2026-00046")).toBeTruthy();
  });

  it("sin solicitudes muestra el vacío y con filtros ofrece limpiarlos", async () => {
    lista = [];
    const usuario = userEvent.setup();
    abrir("?zona=3");
    await screen.findByText("Ninguna solicitud coincide");
    await usuario.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await screen.findByText("No hay solicitudes pendientes");
    expect(ruta.search).toBe("");
  });

  it("si el back falla muestra el error con reintento", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("caído"));
    abrir();
    await screen.findByText("No pudimos cargar las solicitudes");
  });
});
