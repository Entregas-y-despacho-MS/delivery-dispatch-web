// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
vi.mock("@/domains/seguimiento/components/mini-mapa", () => ({
  default: () => <div role="img" aria-label="Mapa del repartidor" />,
}));
const { publicApi } = await import("@/shared/lib/public-api");
const { AccesoPorCodigo } = await import("@/domains/seguimiento");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/seguimiento/seguimiento.acceso");
// oxlint-disable-next-line no-restricted-imports -- la página se prueba entera.
const { default: SeguimientoBuscarPage } = await import("@/pages/public/seguimiento-buscar");

const SESION = "a".repeat(64);
const VISTA = {
  trackingCode: "DSP-2026-00045", status: "scheduled", deliveryDate: "2026-11-26",
  windowStart: "2026-11-26T14:00:00.000Z", windowEnd: "2026-11-26T16:00:00.000Z",
  eta: null, driver: null, location: null,
};

function errorHttp(status: number, code: string, url = "/public/tracking/access/verify") {
  const config = { url, headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, {
    status, statusText: "", data: { statusCode: status, error: code, message: "x" }, headers: {}, config,
  });
}

let post: ReturnType<typeof vi.fn>;
let get: ReturnType<typeof vi.fn>;

beforeEach(() => {
  post = vi.fn(async (url: string) => {
    if (url.endsWith("/code")) return { data: { accepted: true, expiresInSeconds: 600 } };
    return { data: { session: SESION, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() } };
  });
  get = vi.fn(async () => ({ data: VISTA }));
  vi.spyOn(publicApi, "post").mockImplementation(post as never);
  vi.spyOn(publicApi, "get").mockImplementation(get as never);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function montar(ui = <AccesoPorCodigo />) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={cliente}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

async function llegarAlCodigo(user: ReturnType<typeof userEvent.setup>, codigo = " dsp-2026-00045 ") {
  await user.type(screen.getByLabelText("Código de seguimiento"), codigo);
  await user.click(screen.getByRole("button", { name: /Enviarme un código/ }));
  await screen.findByLabelText("Código de 6 dígitos");
}

describe("reglas del acceso por código (ST-309.2)", () => {
  it("normaliza el código y solo valida el tamaño, no la forma", () => {
    expect(reglas.normalizarCodigoSeguimiento(" dsp-2026-00001 ")).toBe("DSP-2026-00001");
    expect(reglas.problemaCodigoSeguimiento("   ")).toMatch(/Escribe el código/);
    expect(reglas.problemaCodigoSeguimiento("x".repeat(41))).toMatch(/máximo 40/);
    expect(reglas.problemaCodigoSeguimiento("cualquier-cosa")).toBeNull();
  });

  it("el OTP son 6 dígitos y se limpian espacios al pegar", () => {
    expect(reglas.limpiarCodigoUnSoloUso("482 913")).toBe("482913");
    expect(reglas.esCodigoUnSoloUso("48291")).toBe(false);
    expect(reglas.esCodigoUnSoloUso("482913")).toBe(true);
  });

  it("espera 60 s entre envíos", () => {
    expect(reglas.segundosParaReenviar(null, 0)).toBe(0);
    expect(reglas.segundosParaReenviar(0, 15_000)).toBe(45);
    expect(reglas.segundosParaReenviar(0, 60_000)).toBe(0);
  });

  it("un 400 nunca dice si el código existe", () => {
    const mensaje = reglas.mensajeErrorAcceso({ kind: "validation", status: 400, code: "INVALID_ACCESS_CODE", message: "", validationMessages: [], retryable: false });
    expect(mensaje).not.toMatch(/no existe|registrad|correo/i);
    expect(reglas.textoCodigoPedido(600)).toMatch(/^Si el código de seguimiento es correcto/);
  });
});

describe("acceso por código y OTP (ST-309.2)", () => {
  it("pide el código con el código normalizado y verifica con la sesión en cabecera, nunca en la URL", async () => {
    const user = userEvent.setup();
    montar();
    await llegarAlCodigo(user);
    expect(post).toHaveBeenCalledWith("/public/tracking/access/code", { trackingCode: "DSP-2026-00045" });
    expect(screen.getByRole("status").textContent).toMatch(/Si el código de seguimiento es correcto.*Vence en 10 min/);

    await user.type(screen.getByLabelText("Código de 6 dígitos"), "482913");
    await user.click(screen.getByRole("button", { name: /Ver mi pedido/ }));
    expect(post).toHaveBeenLastCalledWith("/public/tracking/access/verify", { trackingCode: "DSP-2026-00045", code: "482913" });

    expect(await screen.findByText("Entrega programada")).toBeTruthy();
    const [url, opciones] = get.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toBe("/public/tracking/access/view");
    expect(url).not.toContain(SESION);
    expect(opciones.headers["X-Tracking-Session"]).toBe(SESION);
    expect(screen.getByText(/Solo consulta/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Confirmar|Reprogramar|Calificar/ })).toBeNull();
  });

  it("no guarda la sesión en el almacenamiento del navegador", async () => {
    const user = userEvent.setup();
    montar();
    await llegarAlCodigo(user);
    await user.type(screen.getByLabelText("Código de 6 dígitos"), "482913");
    await user.click(screen.getByRole("button", { name: /Ver mi pedido/ }));
    await screen.findByText("Entrega programada");
    const guardado = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(guardado).not.toContain(SESION);
  });

  it("un código incorrecto da el mensaje genérico y deja intentar de nuevo", async () => {
    post.mockImplementation(async (url: string) => {
      if (url.endsWith("/code")) return { data: { accepted: true, expiresInSeconds: 600 } };
      throw errorHttp(400, "INVALID_ACCESS_CODE");
    });
    const user = userEvent.setup();
    montar();
    await llegarAlCodigo(user);
    await user.type(screen.getByLabelText("Código de 6 dígitos"), "000000");
    await user.click(screen.getByRole("button", { name: /Ver mi pedido/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Los datos no son válidos/);
    expect(screen.getByLabelText("Código de 6 dígitos")).toBeTruthy();
  });

  it("no deja pedir otro código hasta que pasen 60 s", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"], shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    montar();
    await llegarAlCodigo(user);
    const reenviar = screen.getByRole("button", { name: /Pedir otro código en \d+ s/ });
    expect((reenviar as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { vi.advanceTimersByTime(61_000); });
    const listo = screen.getByRole("button", { name: /No me llegó, pedir otro código/ });
    expect((listo as HTMLButtonElement).disabled).toBe(false);
    await user.click(listo);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("con 429 pide esperar sin decir nada del pedido", async () => {
    post.mockRejectedValue(errorHttp(429, "TRACKING_ACCESS_RATE_LIMITED", "/public/tracking/access/code"));
    const user = userEvent.setup();
    montar();
    await user.type(screen.getByLabelText("Código de seguimiento"), "DSP-2026-00045");
    await user.click(screen.getByRole("button", { name: /Enviarme un código/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/demasiados intentos/);
  });

  it("si la sesión ya no sirve (401) vuelve al inicio y pide verificarse otra vez", async () => {
    get.mockRejectedValue(errorHttp(401, "TRACKING_SESSION_INVALID", "/public/tracking/access/view"));
    const user = userEvent.setup();
    montar();
    await llegarAlCodigo(user);
    await user.type(screen.getByLabelText("Código de 6 dígitos"), "482913");
    await user.click(screen.getByRole("button", { name: /Ver mi pedido/ }));
    expect(await screen.findByText(/Tu acceso venció/)).toBeTruthy();
    expect(screen.getByLabelText("Código de seguimiento")).toBeTruthy();
  });

  it("al salir olvida el pedido y vuelve al primer paso", async () => {
    const user = userEvent.setup();
    montar();
    await llegarAlCodigo(user);
    await user.type(screen.getByLabelText("Código de 6 dígitos"), "482913");
    await user.click(screen.getByRole("button", { name: /Ver mi pedido/ }));
    await screen.findByText("Entrega programada");
    await user.click(screen.getByRole("button", { name: /Salir/ }));
    expect(screen.queryByText("Entrega programada")).toBeNull();
    expect(screen.getByLabelText("Código de seguimiento")).toBeTruthy();
  });

  it("la página ofrece las dos formas: código o enlace", async () => {
    const user = userEvent.setup();
    montar(<SeguimientoBuscarPage />);
    expect(screen.getByLabelText("Código de seguimiento")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Con el enlace" }));
    expect(screen.getByLabelText("Token de seguimiento")).toBeTruthy();
  });
});
