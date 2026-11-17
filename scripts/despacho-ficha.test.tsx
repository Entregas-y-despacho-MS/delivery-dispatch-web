// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DespachoDetalle, EvidenciaDetalle } from "@/domains/despachos";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el componente directamente.
const { DespachoFicha } = await import("@/domains/despachos/components/despacho-ficha");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el componente directamente.
const { EvidenciaVisor } = await import("@/domains/despachos/components/evidencia-visor");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la regla directamente.
const { urlVencida, etiquetaEvento } = await import("@/domains/despachos/despacho-detalle.format");
afterEach(cleanup);

const AHORA = Date.parse("2026-10-19T15:00:00Z");
const enMinutos = (minutos: number) => new Date(AHORA + minutos * 60_000).toISOString();

const foto: EvidenciaDetalle = {
  id: "ev-foto", type: "photo", accessUrl: "https://cdn.test/foto-1.jpg?sig=a", accessUrlExpiresAt: enMinutos(4),
  capturedAt: "2026-10-19T14:20:05Z", latitude: -16.50001, longitude: -68.14998, receiverName: null, receiverDocument: null,
};
const firma: EvidenciaDetalle = {
  id: "ev-firma", type: "signature", accessUrl: "https://cdn.test/firma.png?sig=b", accessUrlExpiresAt: enMinutos(4),
  capturedAt: "2026-10-19T14:21:00Z", latitude: null, longitude: null, receiverName: "Ana Torrez", receiverDocument: "4455667 LP",
};
const otp: EvidenciaDetalle = {
  id: "ev-otp", type: "otp", accessUrl: null, accessUrlExpiresAt: null,
  capturedAt: "2026-10-19T14:19:00Z", latitude: null, longitude: null, receiverName: null, receiverDocument: null,
};

const despacho: DespachoDetalle = {
  id: 120, trackingCode: "DSP-2026-00120", sourceOrderRef: "SO-1001",
  type: { id: 1, name: "delivery" }, status: { id: 7, name: "delivered" }, priority: "urgent",
  serviceLevel: { id: 2, name: "Express" }, evidencePolicy: "hand_delivery_standard", paymentStatusLabel: "Prepagado", rating: null,
  scheduledWindowStart: "2026-10-19T12:00:00Z", scheduledWindowEnd: "2026-10-19T14:00:00Z", createdAt: "2026-10-18T10:00:00Z",
  destination: {
    address: "Av. Arce 2100, Sopocachi", reference: "Frente a la farmacia", latitude: -16.5, longitude: -68.15,
    contactName: "Ana Torrez", contactPhone: "+59170000000", zone: { id: 3, name: "Zona Sur" },
  },
  packages: [{ id: 1, externalPackageId: "PKG-1", lengthCm: 40, widthCm: 30, heightCm: 20, grossWeightKg: 4.5, handlingConditions: ["frágil"] }],
  route: {
    id: 55, status: "in_execution", shiftDate: "2026-10-19", sequenceOrder: 2,
    driver: { id: 9, fullName: "Juan Rojas" }, vehicle: { id: 3, plate: "ABC-123", type: "van", model: "Toyota Hiace" },
  },
  receiver: firma,
  timeline: [
    { id: 1, eventType: "promise_approved", detail: null, status: null, reason: "Coordinator approved the delivery promise", occurredAt: "2026-10-18T22:00:00Z", latitude: null, longitude: null, actorType: "user", operator: { id: 1, fullName: "Root" } },
    { id: 2, eventType: "status_changed", detail: "assigned to in_transit", status: "in_transit", reason: null, occurredAt: "2026-10-19T13:05:10Z", latitude: -16.49, longitude: -68.13, actorType: "user", operator: { id: 9, fullName: "Juan Rojas" } },
    { id: 3, eventType: "algo_nuevo_del_back", detail: null, status: null, reason: null, occurredAt: "2026-10-19T14:22:00Z", latitude: null, longitude: null, actorType: "system", operator: null },
  ],
  incidents: [{ id: "inc-1", reasonCode: "customer_absent", reasonName: "Cliente ausente", description: "Nadie abrió", occurredAt: "2026-10-18T15:00:00Z" }],
  reschedules: [{
    id: 4, reasonCode: "customer_request", reasonName: "Pedido del cliente", rescheduledByType: "coordinator", rescheduledBy: { id: 1, fullName: "Root" },
    previousRouteBatchId: 50, newRouteBatchId: 55, previousWindowStart: "2026-10-18T12:00:00Z", previousWindowEnd: "2026-10-18T14:00:00Z",
    newWindowStart: "2026-10-19T12:00:00Z", newWindowEnd: "2026-10-19T14:00:00Z", createdAt: "2026-10-18T16:00:00Z",
  }],
  evidences: [otp, foto, firma],
};

const ficha = (cambios: Partial<DespachoDetalle> = {}, extra: { onRenovar?: () => void; renovando?: boolean } = {}) =>
  render(<DespachoFicha despacho={{ ...despacho, ...cambios }} onRenovar={extra.onRenovar ?? vi.fn()} renovando={extra.renovando ?? false} ahora={AHORA} />);

async function abrirPestana(nombre: RegExp) {
  await userEvent.click(screen.getByRole("tab", { name: nombre }));
}

describe("ficha 360° del despacho (ST-56.1)", () => {
  it("la pestaña General muestra datos, destino, bultos, repartidor, vehículo y etiqueta de pago", () => {
    ficha();
    expect(screen.getByRole("heading", { name: "SO-1001" })).toBeTruthy();
    expect(screen.getByText("Entregado")).toBeTruthy();
    const pedido = screen.getByRole("region", { name: "Pedido" });
    expect(within(pedido).getByText("Prepagado")).toBeTruthy();
    expect(within(pedido).getByText("08:00–10:00")).toBeTruthy();
    const destino = screen.getByRole("region", { name: "Destino" });
    expect(within(destino).getByText("Av. Arce 2100, Sopocachi")).toBeTruthy();
    expect(within(destino).getByRole("link", { name: "-16.50000, -68.15000" }).getAttribute("href")).toContain("-16.5,-68.15");
    const ruta = screen.getByRole("region", { name: "Ruta" });
    expect(within(ruta).getByText("Juan Rojas")).toBeTruthy();
    expect(within(ruta).getByText("ABC-123 · Toyota Hiace")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Bultos" }).textContent).toContain("40×30×20 cm · 4,5 kg");
  });

  it("sin ruta ni firma se dice claramente, sin inventar datos", () => {
    ficha({ route: null, receiver: null, paymentStatusLabel: null });
    expect(screen.getByText("Todavía no está en una ruta")).toBeTruthy();
    expect(screen.getByText("Nadie firmó todavía")).toBeTruthy();
  });

  it("la sección de opinión muestra puntaje, fecha y comentario del cliente", () => {
    ficha({ rating: { score: 5, comment: "Llegó rápido y en buen estado.", createdAt: "2026-10-19T15:00:00Z" } });
    const opinion = screen.getByRole("region", { name: "Opinión del cliente" });
    expect(within(opinion).getByRole("img", { name: "5 de 5 estrellas" })).toBeTruthy();
    expect(opinion.textContent).toContain("Llegó rápido y en buen estado.");
    expect(opinion.textContent).toContain("19/10/2026");
  });

  it("la sección de opinión explica cuando el cliente todavía no calificó", () => {
    ficha({ rating: null });
    expect(screen.getByRole("region", { name: "Opinión del cliente" }).textContent).toContain("El cliente todavía no calificó la entrega.");
  });

  it("la línea de tiempo muestra hora exacta, estado, GPS, operador y al final el receptor", async () => {
    ficha();
    await abrirPestana(/Línea de tiempo/);
    const lista = screen.getByRole("list", { name: "Línea de tiempo" });
    const eventos = within(lista).getAllByRole("listitem");
    expect(eventos).toHaveLength(3);
    expect(eventos[1].textContent).toContain("Cambio de estado → En camino");
    expect(eventos[1].textContent).toContain("19/10/2026, 09:05:10");
    expect(within(eventos[1]).getByRole("link", { name: "-16.49000, -68.13000" })).toBeTruthy();
    expect(eventos[1].textContent).toContain("Juan Rojas");
    expect(eventos[0].textContent).toContain("Sin GPS");
    expect(eventos[2].textContent).toContain("Algo nuevo del back");
    expect(eventos[2].textContent).toContain("Sistema");
    expect(screen.getByLabelText("Receptor").textContent).toContain("Recibió: Ana Torrez (4455667 LP)");
  });

  it("sin eventos, evidencias o incidencias muestra mensajes claros", async () => {
    ficha({ timeline: [], evidences: [], incidents: [], reschedules: [] });
    await abrirPestana(/Línea de tiempo/);
    expect(screen.getByText("El despacho todavía no tiene eventos registrados.")).toBeTruthy();
    await abrirPestana(/Evidencias/);
    expect(screen.getByText("El despacho no tiene evidencias digitales todavía.")).toBeTruthy();
    await abrirPestana(/Incidencias/);
    expect(screen.getByText("El repartidor no reportó incidencias.")).toBeTruthy();
    expect(screen.getByText("El pedido no se reprogramó.")).toBeTruthy();
  });

  it("la pestaña Incidencias incluye las reprogramaciones con la franja anterior y la nueva", async () => {
    ficha();
    await abrirPestana(/Incidencias \(2\)/);
    expect(screen.getByText("Cliente ausente")).toBeTruthy();
    expect(screen.getByText("Nadie abrió")).toBeTruthy();
    const cambios = screen.getByRole("region", { name: "Reprogramaciones" });
    expect(cambios.textContent).toContain("Pedido del cliente");
    expect(cambios.textContent).toMatch(/Root: dom.*08:00–10:00 → lun.*08:00–10:00/);
  });

  it("las evidencias se listan con miniatura y el OTP sin archivo no abre el visor", async () => {
    ficha();
    await abrirPestana(/Evidencias \(3\)/);
    const lista = screen.getByRole("list", { name: "Evidencias digitales" });
    const botones = within(lista).getAllByRole("button");
    expect(botones).toHaveLength(3);
    expect(botones[0].hasAttribute("disabled")).toBe(true);
    expect(botones[0].textContent).toContain("Validado, sin archivo");
  });
});

describe("visor de evidencias", () => {
  it("abre la foto en alta resolución con zoom y metadatos de captura", async () => {
    ficha();
    await abrirPestana(/Evidencias/);
    await userEvent.click(screen.getByRole("button", { name: /Ver fotografía/ }));
    const visor = await screen.findByRole("dialog");
    const imagen = within(visor).getByRole("img");
    expect(imagen.getAttribute("src")).toBe(foto.accessUrl);
    expect(imagen.getAttribute("style")).toContain("width: 100%");
    expect(visor.textContent).toContain("19/10/2026, 10:20:05");
    expect(within(visor).getByRole("link", { name: "-16.50001, -68.14998" })).toBeTruthy();
    await userEvent.click(within(visor).getByRole("button", { name: "Acercar" }));
    await userEvent.click(within(visor).getByRole("button", { name: "Acercar" }));
    expect(imagen.getAttribute("style")).toContain("width: 200%");
    expect(within(visor).getByText("200 %")).toBeTruthy();
  });

  it("la firma muestra quién recibió", async () => {
    ficha();
    await abrirPestana(/Evidencias/);
    await userEvent.click(screen.getByRole("button", { name: /Ver firma/ }));
    expect((await screen.findByRole("dialog")).textContent).toContain("Ana Torrez (4455667 LP)");
  });

  it("al abrir una evidencia con la URL vencida pide una nueva y no muestra la imagen vieja", async () => {
    const onRenovar = vi.fn();
    const vencida = { ...foto, accessUrlExpiresAt: enMinutos(-1) };
    ficha({ evidences: [vencida] }, { onRenovar });
    await abrirPestana(/Evidencias/);
    await userEvent.click(screen.getByRole("button", { name: /Ver fotografía/ }));
    expect(onRenovar).toHaveBeenCalledTimes(1);
    const visor = await screen.findByRole("dialog");
    expect(within(visor).queryByRole("img")).toBeNull();
    expect(visor.textContent).toContain("El enlace de la imagen venció");
  });

  it("si la imagen no carga pide un enlace nuevo una sola vez y luego ofrece reintentar", async () => {
    const onRenovar = vi.fn();
    const { rerender } = render(<EvidenciaVisor evidencia={foto} onCerrar={vi.fn()} onRenovar={onRenovar} renovando={false} ahora={AHORA} />);
    const imagen = (await screen.findByRole("dialog")).querySelector("img");
    imagen?.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(onRenovar).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("No se pudo cargar la imagen.")).toBeTruthy();
    // Llega la URL nueva: vuelve a mostrar la imagen.
    const renovada = { ...foto, accessUrl: "https://cdn.test/foto-1.jpg?sig=nueva", accessUrlExpiresAt: enMinutos(5) };
    rerender(<EvidenciaVisor evidencia={renovada} onCerrar={vi.fn()} onRenovar={onRenovar} renovando={false} ahora={AHORA} />);
    expect(screen.getByRole("dialog").querySelector("img")?.getAttribute("src")).toBe(renovada.accessUrl);
  });
});

describe("reglas de la ficha", () => {
  it("una URL vence 10 s antes de su hora y un OTP nunca", () => {
    expect(urlVencida(foto, AHORA)).toBe(false);
    expect(urlVencida({ ...foto, accessUrlExpiresAt: new Date(AHORA + 5_000).toISOString() }, AHORA)).toBe(true);
    expect(urlVencida(otp, AHORA)).toBe(false);
    expect(etiquetaEvento("promise_firmed")).toBe("Promesa firme");
  });
});
