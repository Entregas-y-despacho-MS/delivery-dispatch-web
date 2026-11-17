// @vitest-environment jsdom
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SeguimientoPublico } from "@/domains/seguimiento";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { publicApi } = await import("@/shared/lib/public-api");
const { SeguimientoPublicoVista, calificarEntrega } = await import("@/domains/seguimiento");

const TOKEN = "token-de-prueba";
const RUTA = `/public/tracking/${TOKEN}`;
const CERRADO = { open: false, closedReason: "not_open" as const, windowClosesAt: null, rescheduleAttemptsLeft: 0, canConfirm: false, canReschedule: false, canRequestChange: false };
const BASE: SeguimientoPublico = {
  trackingCode: "DSP-2026-00045", status: "scheduled", customerConfirmation: "confirmed", deliveryDate: "2026-11-06",
  windowStart: "2026-11-06T14:00:00.000Z", windowEnd: "2026-11-06T16:00:00.000Z",
  eta: null, driver: null, location: null, selfService: CERRADO, rating: null, canRate: false,
};
const ENTREGADO: SeguimientoPublico = { ...BASE, status: "delivered", canRate: true };
const CALIFICACION = { score: 4, comment: null, createdAt: "2026-11-08T21:27:00.000Z" };
const CALIFICADO: SeguimientoPublico = { ...ENTREGADO, canRate: false, rating: CALIFICACION };

function errorHttp(status: number, code: string) {
  const config = { url: `${RUTA}/rating`, headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, {
    status, statusText: "", data: { statusCode: status, error: code, message: "x" }, headers: {}, config,
  });
}

let respuestas: SeguimientoPublico[];
let get: ReturnType<typeof vi.fn>;
let post: ReturnType<typeof vi.fn>;
beforeEach(() => {
  respuestas = [ENTREGADO];
  // Cada GET devuelve la siguiente respuesta; la última se repite.
  get = vi.fn(async () => ({ data: respuestas.length > 1 ? respuestas.shift() : respuestas[0] }));
  post = vi.fn(async () => ({ data: CALIFICACION }));
  vi.spyOn(publicApi, "get").mockImplementation(get as never);
  vi.spyOn(publicApi, "post").mockImplementation(post as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function abrir() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SeguimientoPublicoVista token={TOKEN} />
    </QueryClientProvider>,
  );
}

const tarjeta = () => within(screen.getByRole("region", { name: "Califica tu entrega" }));
const estrella = (n: number) => tarjeta().getByRole("radio", { name: n === 1 ? "1 estrella" : `${n} estrellas` });
const botonEnviar = () => tarjeta().getByRole("button", { name: "Enviar calificación" }) as HTMLButtonElement;

describe("tarjeta «Califica tu entrega» (ST-42.2)", () => {
  it("sin canRate ni calificación no ocupa lugar", async () => {
    respuestas = [BASE];
    abrir();
    await screen.findByText("DSP-2026-00045");
    expect(screen.queryByRole("region", { name: "Califica tu entrega" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Tu calificación" })).toBeNull();
  });

  it("con canRate muestra 5 estrellas y no deja enviar sin elegir una", async () => {
    abrir();
    await screen.findByRole("region", { name: "Califica tu entrega" });
    expect(tarjeta().getAllByRole("radio")).toHaveLength(5);
    expect(tarjeta().getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
    expect(botonEnviar().disabled).toBe(true);
  });

  it("al elegir una estrella la marca, muestra su nombre y habilita el envío", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("region", { name: "Califica tu entrega" });
    await user.click(estrella(4));
    expect(estrella(4).getAttribute("aria-checked")).toBe("true");
    expect(estrella(5).getAttribute("aria-checked")).toBe("false");
    expect(tarjeta().getByText("Buena")).toBeTruthy();
    expect(botonEnviar().disabled).toBe(false);
  });

  it("se elige con el teclado: flechas, Inicio y Fin", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("region", { name: "Califica tu entrega" });
    // Sin elegir, solo la primera estrella entra con Tab.
    expect(estrella(1).tabIndex).toBe(0);
    expect(estrella(2).tabIndex).toBe(-1);
    estrella(1).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(estrella(2).getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{End}");
    expect(estrella(5).getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(estrella(5));
    await user.keyboard("{ArrowLeft}");
    expect(estrella(4).getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{Home}");
    expect(estrella(1).getAttribute("aria-checked")).toBe("true");
  });

  it("al enviar manda el puntaje y queda el agradecimiento en solo lectura", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("region", { name: "Califica tu entrega" });
    await user.click(estrella(4));
    await user.click(botonEnviar());
    expect(post).toHaveBeenCalledWith(`${RUTA}/rating`, { score: 4 });
    const gracias = within(await screen.findByRole("region", { name: "Tu calificación" }));
    expect(gracias.getByText("¡Gracias por calificar tu entrega!")).toBeTruthy();
    expect(gracias.getByRole("img", { name: "4 estrellas de 5" })).toBeTruthy();
    expect(gracias.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("button", { name: "Enviar calificación" })).toBeNull();
  });

  it("si ya estaba calificada, muestra sus estrellas sin dejar volver a calificar", async () => {
    respuestas = [CALIFICADO];
    abrir();
    const gracias = within(await screen.findByRole("region", { name: "Tu calificación" }));
    expect(gracias.getByRole("img", { name: "4 estrellas de 5" })).toBeTruthy();
    expect(gracias.getByText(/Buena · Calificada el/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Califica tu entrega" })).toBeNull();
  });

  it("con 409 «ya calificada» recarga la vista y muestra la calificación guardada", async () => {
    respuestas = [ENTREGADO, CALIFICADO];
    post.mockRejectedValueOnce(errorHttp(409, "RATING_ALREADY_SUBMITTED"));
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("region", { name: "Califica tu entrega" });
    await user.click(estrella(2));
    await user.click(botonEnviar());
    expect(await screen.findByRole("region", { name: "Tu calificación" })).toBeTruthy();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("con 409 «todavía no se puede» muestra el aviso y recarga", async () => {
    respuestas = [ENTREGADO, BASE];
    post.mockRejectedValueOnce(errorHttp(409, "RATING_NOT_ALLOWED"));
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("region", { name: "Califica tu entrega" });
    await user.click(estrella(5));
    await user.click(botonEnviar());
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    // Recargado sin canRate, la tarjeta ya no se muestra.
    await waitFor(() => expect(screen.queryByRole("region", { name: "Califica tu entrega" })).toBeNull());
  });
});

describe("servicio de calificación (ST-42.2)", () => {
  it("manda el comentario recortado y omite el vacío (lo usa ST-43.2)", async () => {
    await calificarEntrega(TOKEN, { score: 5, comment: "  Muy puntual  " });
    expect(post).toHaveBeenLastCalledWith(`${RUTA}/rating`, { score: 5, comment: "Muy puntual" });
    await calificarEntrega(TOKEN, { score: 3, comment: "   " });
    expect(post).toHaveBeenLastCalledWith(`${RUTA}/rating`, { score: 3 });
  });
});
