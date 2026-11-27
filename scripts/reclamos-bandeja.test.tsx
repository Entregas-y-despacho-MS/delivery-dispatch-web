// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Reclamo, ReclamoDetalle } from "@/domains/reclamos";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/reclamos/reclamos.reglas");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: ReclamosPage } = await import("@/pages/dashboard/reclamos-page");

const fila = (r: Partial<Reclamo> & Pick<Reclamo, "complaintId">): Reclamo => ({
  crmCaseId: `CRM-${r.complaintId}`, dispatchId: 100 + r.complaintId, trackingCode: `DSP-2026-000${r.complaintId}`, caseVersion: 1,
  reasonCode: "DAMAGED_ITEM", investigationStatus: "received", nextAction: "assign", eligible: true, dispatchStatus: "delivered",
  zoneId: 3, zoneName: "Centro", assignedUserId: null, assignedUserName: null, verdict: null, authorizationPending: false,
  receivedAt: "2026-11-25T12:00:00.000Z", openedAt: "2026-11-25T11:50:00.000Z", assignedAt: null, decidedAt: null,
  updatedAt: "2026-11-25T12:00:00.000Z", ...r,
});
const detalle = (r: Partial<ReclamoDetalle> & Pick<Reclamo, "complaintId">): ReclamoDetalle => ({
  ...fila(r), investigationStartedAt: null, findings: null, decisionReason: null, decidedByUserId: null, decidedByUserName: null,
  authorizationRequestId: null, rmaId: null, affectedItems: [{ packageId: "PKG-1", itemCode: "SKU-9", quantity: 2 }],
  routeBatchId: 8, routeBatchStatus: "in_execution", ...r,
});

const RECIBIDO = fila({ complaintId: 12 });
const EN_INVESTIGACION = fila({ complaintId: 13, investigationStatus: "in_investigation", nextAction: "issue_verdict", assignedUserId: 4, assignedUserName: "Ana Rojas", caseVersion: 3 });

let casos: Record<number, ReclamoDetalle>;
let get: ReturnType<typeof vi.fn>;
let post: ReturnType<typeof vi.fn>;
const pedidosBandeja = () => get.mock.calls.filter(([url]) => url === "/complaint-cases").map(([, config]) => config.params);

function errorHttp(status: number, code: string) {
  const config = { url: "/complaint-cases", headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, {
    status, statusText: "", data: { statusCode: status, error: code, message: "x" }, headers: {}, config,
  });
}

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  casos = { 12: detalle({ complaintId: 12 }), 13: detalle({ ...EN_INVESTIGACION }) };
  get = vi.fn(async (url: string) => {
    if (url === "/complaint-cases") return { data: { data: [RECIBIDO, EN_INVESTIGACION], meta: { page: 1, limit: 20, pages: 2, total: 21 } } };
    const id = Number(url.split("/").pop());
    if (url.startsWith("/complaint-cases/")) return { data: casos[id] };
    return { data: { data: [{ id: 3, name: "Centro" }], meta: { page: 1, limit: 100, pages: 1, total: 1 } } };
  });
  post = vi.fn();
  vi.spyOn(api, "get").mockImplementation(get as never);
  vi.spyOn(api, "post").mockImplementation(post as never);
  useAuthStore.setState({ user: { id: "4", rol: { id: 2, nombre: "Coordinador" } } as never });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Ubicacion() {
  const { search } = useLocation();
  return <output data-testid="ubicacion">{search}</output>;
}

function abrir(ruta = "/app/reclamos") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <ReclamosPage />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const url = () => screen.getByTestId("ubicacion").textContent ?? "";
const tabla = () => within(screen.getAllByRole("table")[0]);

describe("reglas de reclamos (ST-45.3)", () => {
  it("lee la URL, ignora lo inválido y arma los params del back", () => {
    const f = reglas.leerFiltrosReclamos(new URLSearchParams("desde=2026-11-01&hasta=2026-11-20&zona=3&motivo=DAMAGED&estado=assigned&responsable=4&pagina=2"));
    expect(reglas.paramsReclamos(f)).toEqual({ page: 2, limit: 20, from: "2026-11-01", to: "2026-11-20", zoneId: 3, reasonCode: "DAMAGED", status: "assigned", assignedUserId: 4 });
    expect(reglas.leerFiltrosReclamos(new URLSearchParams("desde=ayer&estado=cerrado&zona=-1&pagina=0"))).toMatchObject({ desde: "", estado: null, zona: null, pagina: 1 });
    expect(reglas.problemaFiltrosReclamos({ ...reglas.filtrosReclamosPorDefecto(), desde: "2026-11-20", hasta: "2026-11-01" })).toBe("rango-invertido");
  });

  it("antigüedad, estado pendiente de Inventarios y validación del dictamen", () => {
    const ahora = Date.parse("2026-11-25T15:00:00Z");
    expect(reglas.antiguedad("2026-11-25T14:15:00Z", ahora)).toBe("hace 45 min");
    expect(reglas.antiguedad("2026-11-25T10:00:00Z", ahora)).toBe("hace 5 h");
    expect(reglas.antiguedad("2026-11-22T15:00:00Z", ahora)).toBe("hace 3 d");
    expect(reglas.estadoVisible({ investigationStatus: "decided", authorizationPending: true })).toBe("Autorización pendiente");
    expect(reglas.validarDictamen({ verdict: null, decisionReason: "", findings: "ver https://x.com" })).toEqual({
      verdict: "Elige un dictamen.", decisionReason: "Escribe el motivo del dictamen.",
      findings: "Los hallazgos no pueden tener enlaces: la evidencia se referencia, no se publica.",
    });
  });
});

describe("bandeja de reclamos (ST-45.3)", () => {
  it("lista caso CRM, despacho, estado, motivo, antigüedad, responsable y siguiente acción", async () => {
    abrir();
    expect(await screen.findAllByText("CRM-12")).toBeTruthy();
    const filas = tabla().getAllByRole("row");
    const primera = within(filas[1]);
    expect(primera.getByText("DSP-2026-00012")).toBeTruthy();
    expect(primera.getByText("Recibido")).toBeTruthy();
    expect(primera.getByText("DAMAGED_ITEM")).toBeTruthy();
    expect(primera.getByText("hace 3 h")).toBeTruthy();
    expect(primera.getByText("Sin asignar")).toBeTruthy();
    expect(primera.getByText("Tomar el caso")).toBeTruthy();
    expect(screen.getByText(/21 reclamos/)).toBeTruthy();
  });

  it("los filtros van a la URL y al back; «Solo mis casos» usa mi usuario", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("CRM-12");
    await user.selectOptions(screen.getByLabelText("Estado"), "in_investigation");
    await user.click(screen.getByLabelText("Solo mis casos"));
    await waitFor(() => expect(pedidosBandeja().at(-1)).toMatchObject({ status: "in_investigation", assignedUserId: 4, page: 1 }));
    expect(url()).toContain("estado=in_investigation");
    expect(url()).toContain("responsable=4");
  });

  it("un rango invertido no consulta y lo explica", async () => {
    abrir("/app/reclamos?desde=2026-11-20&hasta=2026-11-01");
    expect((await screen.findByRole("alert")).textContent).toMatch(/no puede ser posterior/);
    expect(pedidosBandeja()).toHaveLength(0);
  });

  it("sin permiso no muestra datos y conserva los filtros", async () => {
    get.mockImplementation(async (u: string) => {
      if (u === "/complaint-cases") throw errorHttp(403, "INSUFFICIENT_PERMISSIONS");
      return { data: { data: [], meta: { page: 1, limit: 100, pages: 0, total: 0 } } };
    });
    abrir("/app/reclamos?estado=assigned");
    expect(await screen.findByText(/No tienes permiso/)).toBeTruthy();
    expect(screen.queryByText("CRM-12")).toBeNull();
    expect(url()).toContain("estado=assigned");
  });
});

describe("detalle y comandos del reclamo (ST-45.3)", () => {
  it("abre el detalle con cronología, despacho y evidencia protegida; tomar el caso muestra el acuse", async () => {
    post.mockImplementation(async () => {
      casos[12] = detalle({ complaintId: 12, investigationStatus: "assigned", nextAction: "start_investigation", assignedUserId: 4, assignedUserName: "Yo Mismo", assignedAt: "2026-11-25T14:59:00.000Z", caseVersion: 1 });
      return { data: casos[12] };
    });
    const user = userEvent.setup();
    abrir("/app/reclamos?caso=12");
    const hoja = within(await screen.findByRole("dialog"));
    expect(await hoja.findByText("Recibido por Despacho")).toBeTruthy();
    expect(hoja.getByText(/La evidencia queda protegida/)).toBeTruthy();
    expect(hoja.getByRole("link", { name: /Ver despacho #112/ }).getAttribute("href")).toBe("/app/despachos/112");
    await user.click(hoja.getByRole("button", { name: "Tomar el caso" }));
    expect(post).toHaveBeenCalledWith("/complaint-cases/12/assign", { expectedVersion: 1 }, expect.anything());
    expect((await hoja.findByRole("status")).textContent).toMatch(/Tomaste el caso/);
    expect(hoja.getByRole("button", { name: /Iniciar investigación/ })).toBeTruthy();
    expect(hoja.queryByRole("button", { name: /Aprobar|Cerrar caso/ })).toBeNull();
  });

  it("request_RMA muestra los ítems, explica Inventarios y envía la versión leída", async () => {
    post.mockImplementation(async (_u: string, cuerpo: Record<string, unknown>) => {
      casos[13] = detalle({ ...EN_INVESTIGACION, investigationStatus: "decided", nextAction: "await_inventory_authorization", verdict: "request_RMA", authorizationPending: true, decisionReason: String(cuerpo.decisionReason), findings: String(cuerpo.findings), authorizationRequestId: "AR-77" });
      return { data: casos[13] };
    });
    const user = userEvent.setup();
    abrir("/app/reclamos?caso=13");
    const hoja = within(await screen.findByRole("dialog"));
    await user.type(await hoja.findByLabelText("Hallazgos de la investigación"), "Caja aplastada en la foto del repartidor");
    await user.click(hoja.getByLabelText(/Solicitar RMA/));
    expect(hoja.getByText(/Se enviará una solicitud pendiente a Inventarios/)).toBeTruthy();
    expect(within(hoja.getByRole("list", { name: "Ítems afectados" })).getByText(/SKU-9/)).toBeTruthy();
    await user.type(hoja.getByLabelText("Motivo de la solicitud de RMA"), "Producto dañado");
    await user.click(hoja.getByRole("button", { name: /Emitir dictamen/ }));
    expect(post).toHaveBeenCalledWith("/complaint-cases/13/verdict", {
      verdict: "request_RMA", decisionReason: "Producto dañado", findings: "Caja aplastada en la foto del repartidor", expectedVersion: 3,
    }, expect.anything());
    expect((await hoja.findByRole("status")).textContent).toMatch(/Dictamen registrado/);
    expect(hoja.getAllByText(/Autorización pendiente|autorización pendiente/).length).toBeGreaterThan(0);
  });

  it("con versión vieja (409) relee el caso y conserva el borrador", async () => {
    post.mockRejectedValue(errorHttp(409, "COMPLAINT_CASE_VERSION_STALE"));
    const user = userEvent.setup();
    abrir("/app/reclamos?caso=13");
    const hoja = within(await screen.findByRole("dialog"));
    await user.type(await hoja.findByLabelText("Hallazgos de la investigación"), "Hallazgo largo");
    await user.click(hoja.getByLabelText(/No confirmado/));
    await user.type(hoja.getByLabelText("Motivo del dictamen"), "Sin pruebas");
    const lecturas = get.mock.calls.filter(([u]) => u === "/complaint-cases/13").length;
    await user.click(hoja.getByRole("button", { name: /Emitir dictamen/ }));
    expect((await hoja.findByRole("alert")).textContent).toMatch(/tu borrador se conserva/);
    await waitFor(() => expect(get.mock.calls.filter(([u]) => u === "/complaint-cases/13").length).toBeGreaterThan(lecturas));
    expect((hoja.getByLabelText("Hallazgos de la investigación") as HTMLTextAreaElement).value).toBe("Hallazgo largo");
    expect((hoja.getByLabelText("Motivo del dictamen") as HTMLTextAreaElement).value).toBe("Sin pruebas");
  });
});
