// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DespachoDetalle } from "@/domains/despachos";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el componente directamente.
const { ReprogramarDespachoDialog } = await import("@/domains/despachos/components/reprogramar-despacho-dialog");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/despachos/reprogramacion.reglas");
const { parseApiError } = await import("@/shared/lib/api-error");
afterEach(cleanup);

// 19/10/2026 11:00 en Bolivia.
const AHORA = Date.parse("2026-10-19T15:00:00Z");
const FRANJAS = [{ inicio: "08:00", fin: "10:00" }, { inicio: "14:00", fin: "16:00" }];
const MOTIVOS = [{ code: "RES-CLI-AUSENTE", name: "Cliente ausente" }, { code: "RES-OPS-RUTA", name: "Problema de ruta" }];

const base: DespachoDetalle = {
  id: 42, trackingCode: "DSP-2026-00042", sourceOrderRef: "SO-2042", type: { id: 1, name: "delivery" },
  status: { id: 9, name: "not_delivered" }, priority: "normal", serviceLevel: null, evidencePolicy: "hand_delivery_standard",
  paymentStatusLabel: null, scheduledWindowStart: null, scheduledWindowEnd: null, createdAt: "2026-10-15T10:00:00Z",
  destination: { address: "Calle 1", reference: null, latitude: null, longitude: null, contactName: null, contactPhone: null, zone: null },
  packages: [], route: null, receiver: null,
  timeline: [
    { id: 1, eventType: "status_changed", detail: null, status: "in_transit", reason: null, occurredAt: "2026-10-17T13:00:00Z", latitude: null, longitude: null, actorType: "user", operator: null },
    { id: 2, eventType: "status_changed", detail: null, status: "not_delivered", reason: "Nadie en casa", occurredAt: "2026-10-17T15:00:00Z", latitude: null, longitude: null, actorType: "user", operator: null },
  ],
  incidents: [],
  reschedules: [],
  evidences: [{ id: "f1", type: "photo", accessUrl: "https://cdn.test/fachada.jpg", accessUrlExpiresAt: "2026-10-19T15:04:00Z", capturedAt: "2026-10-17T15:00:00Z", latitude: null, longitude: null, receiverName: null, receiverDocument: null }],
};

const incidencia = (id: string) => ({ id, reasonCode: "customer_absent", reasonName: "Cliente ausente", description: "Toqué tres veces", occurredAt: "2026-10-18T15:00:00Z" });

function abrir(cambios: Partial<DespachoDetalle> = {}, extra: Partial<Parameters<typeof ReprogramarDespachoDialog>[0]> = {}) {
  const onReprogramar = vi.fn();
  const onDevolver = vi.fn();
  render(
    <ReprogramarDespachoDialog
      abierto onOpenChange={vi.fn()} despacho={{ ...base, ...cambios }} motivos={MOTIVOS} franjas={FRANJAS} limiteIntentos={3}
      enviando={false} devolviendo={false} error={null} onReprogramar={onReprogramar} onDevolver={onDevolver}
      onRenovarFotos={vi.fn()} renovandoFotos={false} ahora={AHORA} {...extra}
    />,
  );
  return { onReprogramar, onDevolver, dialogo: screen.getByRole("dialog") };
}

describe("modal de reprogramación (ST-52.1)", () => {
  it("muestra el historial con motivos, notas del conductor y fotos de fachada, y el intento que toca", () => {
    const { dialogo } = abrir({ incidents: [incidencia("i1")] });
    expect(within(dialogo).getByText("Intento 3 de 3")).toBeTruthy();
    const historial = within(dialogo).getByRole("region", { name: "Historial del pedido" });
    expect(historial.textContent).toContain("No entregado");
    expect(historial.textContent).toContain("Nadie en casa");
    expect(historial.textContent).toContain("Nota del conductor: Toqué tres veces");
    expect(within(historial).getByRole("button", { name: /Foto/ })).toBeTruthy();
  });

  it("el formulario arranca bloqueado y manda la franja en UTC con el motivo y las instrucciones", async () => {
    const { onReprogramar, dialogo } = abrir();
    expect(within(dialogo).getByText("Intento 2 de 3")).toBeTruthy();
    const boton = within(dialogo).getByRole("button", { name: /^Reprogramar$/ });
    expect(boton.hasAttribute("disabled")).toBe(true);

    const fecha = within(dialogo).getByLabelText("Nueva fecha pactada");
    expect(fecha.getAttribute("min")).toBe("2026-10-19");
    fireEvent.change(fecha, { target: { value: "2026-10-21" } });
    await userEvent.selectOptions(within(dialogo).getByLabelText("Franja"), "14:00-16:00");
    await userEvent.selectOptions(within(dialogo).getByLabelText("Motivo"), "RES-OPS-RUTA");
    await userEvent.type(within(dialogo).getByLabelText(/Instrucciones especiales/), "  Llamar antes  ");
    await userEvent.click(boton);

    expect(onReprogramar).toHaveBeenCalledWith({
      reasonCode: "RES-OPS-RUTA",
      windowStart: "2026-10-21T18:00:00Z",
      windowEnd: "2026-10-21T20:00:00Z",
      instructions: "Llamar antes",
    });
  });

  it("una fecha anterior a hoy no se puede mandar", async () => {
    const { onReprogramar, dialogo } = abrir();
    fireEvent.change(within(dialogo).getByLabelText("Nueva fecha pactada"), { target: { value: "2026-10-18" } });
    await userEvent.selectOptions(within(dialogo).getByLabelText("Franja"), "08:00-10:00");
    await userEvent.selectOptions(within(dialogo).getByLabelText("Motivo"), "RES-CLI-AUSENTE");
    expect(within(dialogo).getByText("La fecha no puede ser anterior a hoy.")).toBeTruthy();
    expect(within(dialogo).getByRole("button", { name: /^Reprogramar$/ }).hasAttribute("disabled")).toBe(true);
    expect(onReprogramar).not.toHaveBeenCalled();
  });

  it("avisa cuando el intento que se programa es el último permitido", () => {
    const { dialogo } = abrir({ incidents: [incidencia("i1")] });
    expect(within(dialogo).getByRole("status").textContent).toContain("Este es el último intento permitido");
  });

  it("con el límite alcanzado bloquea el formulario y solo ofrece devolver al almacén", async () => {
    const { onDevolver, dialogo } = abrir({ incidents: [incidencia("i1"), incidencia("i2")] });
    expect(within(dialogo).getByText("Intento 3 de 3")).toBeTruthy();
    const alerta = within(dialogo).getByRole("alert", { name: "Límite de reintentos" });
    expect(alerta.textContent).toContain("Límite de reintentos alcanzado");
    expect(within(dialogo).queryByLabelText("Nueva fecha pactada")).toBeNull();
    expect(within(dialogo).queryByRole("button", { name: /^Reprogramar$/ })).toBeNull();
    await userEvent.type(within(dialogo).getByLabelText(/Nota para la devolución/), "Tres visitas sin respuesta");
    await userEvent.click(within(dialogo).getByRole("button", { name: /Devolver al almacén/ }));
    expect(onDevolver).toHaveBeenCalledWith("Tres visitas sin respuesta");
  });

  it("un despacho programado sin intentos fallidos no ofrece devolver aunque se fuerce el límite", () => {
    const { dialogo } = abrir({ status: { id: 3, name: "scheduled" }, timeline: [] }, { limiteIntentos: 0 });
    expect(within(dialogo).queryByRole("button", { name: /Devolver al almacén/ })).toBeNull();
    expect(dialogo.textContent).toContain("Solo un despacho con incidencia o no entregado puede volver al almacén.");
  });

  it("muestra el error del back dentro del modal", () => {
    const { dialogo } = abrir({}, { error: "El despacho cambió mientras lo editabas." });
    expect(within(dialogo).getAllByRole("alert").some((a) => a.textContent === "El despacho cambió mientras lo editabas.")).toBe(true);
  });
});

describe("reglas de la reprogramación", () => {
  const errorHttp = (status: number, code?: string, message: unknown = "msg") => ({ isAxiosError: true, response: { status, data: { statusCode: status, error: code, message } } });

  it("los 400 y 409 del back se explican en palabras del coordinador", () => {
    const m = (status: number, code?: string, message?: unknown) => reglas.mensajeErrorReprogramacion(parseApiError(errorHttp(status, code, message)));
    expect(m(400, "RESCHEDULE_ATTEMPTS_LIMIT_REACHED")).toMatch(/límite de intentos/);
    expect(m(400, "INVALID_RESCHEDULE_WINDOW")).toMatch(/no puede ser anterior a hoy/);
    expect(m(400, "RESCHEDULE_REASON_INVALID")).toMatch(/motivo/);
    expect(m(409, "DISPATCH_CHANGED_CONCURRENTLY")).toMatch(/cambió mientras lo editabas/);
    expect(m(409, "DISPATCH_STATUS_NOT_RESCHEDULABLE")).toMatch(/ya no se puede reprogramar/);
    expect(m(409, "DELIVERY_ATTEMPTS_NOT_EXHAUSTED")).toMatch(/quedan intentos/);
    expect(m(400, "Bad Request", ["windowStart must be an ISO-8601 date"])).toBe("Revisa los datos: windowStart must be an ISO-8601 date");
    expect(reglas.requiereRecargar(parseApiError(errorHttp(409, "DISPATCH_CHANGED_CONCURRENTLY")))).toBe(true);
    expect(reglas.requiereRecargar(parseApiError(errorHttp(400, "RESCHEDULE_REASON_INVALID")))).toBe(false);
  });

  it("las franjas salen de las ventanas cortadas por la duración y se mandan en UTC", () => {
    expect(reglas.generarFranjas({
      morning_window_start: "08:00", morning_window_end: "12:00", afternoon_window_start: "14:00", afternoon_window_end: "17:00", slot_duration_minutes: "120",
    })).toEqual([{ inicio: "08:00", fin: "10:00" }, { inicio: "10:00", fin: "12:00" }, { inicio: "14:00", fin: "16:00" }]);
    expect(reglas.generarFranjas({ slot_duration_minutes: "" })).toEqual([]);
    expect(reglas.ventanaUtc("2026-10-21", { inicio: "08:00", fin: "10:00" })).toEqual({ windowStart: "2026-10-21T12:00:00Z", windowEnd: "2026-10-21T14:00:00Z" });
    expect(reglas.hoyEnBolivia(Date.parse("2026-10-20T03:30:00Z"))).toBe("2026-10-19");
  });

  it("cuenta las entradas a no entregado una vez y las incidencias, nunca las reprogramaciones", () => {
    const ev = (id: number, status: string) => ({ ...base.timeline[0], id, status });
    expect(reglas.contarIntentos({ timeline: [ev(1, "not_delivered"), ev(2, "not_delivered"), ev(3, "rescheduled"), ev(4, "not_delivered")], incidents: [incidencia("a")] })).toBe(3);
    expect(reglas.estadoIntentos(2, 3)).toMatchObject({ siguiente: 3, ultimo: true, alcanzado: false });
    expect(reglas.estadoIntentos(3, 3)).toMatchObject({ siguiente: 3, ultimo: false, alcanzado: true });
    expect(reglas.puedeReprogramar("assigned")).toBe(true);
    expect(reglas.puedeReprogramar("delivered")).toBe(false);
    expect(reglas.puedeDevolver("scheduled")).toBe(false);
  });
});
