// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DespachoDetalle, ExcluidoCotejo } from "@/domains/despachos";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const toastExito = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastExito(m), error: vi.fn() } }));
const { default: api } = await import("@/shared/lib/axios");
const { useAuthStore } = await import("@/shared/store/use-auth-store");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan las reglas directamente.
const reglas = await import("@/domains/despachos/excluidos-cotejo.reglas");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan los hooks directamente.
const { useCancelarDespacho, useExcluidosCotejo, useResolverCotejo } = await import("@/domains/despachos/hooks/use-excluidos-cotejo");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan los componentes directamente.
const { ExcluidosCotejoPanel } = await import("@/domains/despachos/components/excluidos-cotejo-panel");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan los componentes directamente.
const { CancelarDespachoDialog } = await import("@/domains/despachos/components/cancelar-despacho-dialog");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan los componentes directamente.
const { MarcarResueltoDialog } = await import("@/domains/despachos/components/marcar-resuelto-dialog");
// oxlint-disable-next-line no-restricted-imports -- la prueba de la ficha renderiza la página completa.
const { default: DespachoDetallePage } = await import("@/pages/dashboard/despacho-detalle-page");
const { parseApiError } = await import("@/shared/lib/api-error");

const FALTA: ExcluidoCotejo = {
  dispatchId: 103, routeBatchId: 42, shiftDate: "2026-11-05", sequenceOrder: 3, sourceOrderRef: "SO-1042",
  trackingCode: "DSP-2026-00103", deliveryAddress: "Av. Arce 2345, La Paz", contactName: "María López",
  failures: [{ packageId: "PKG-0001", reason: "damaged", detail: "La caja llegó aplastada.", photoUrl: "https://files.test/cotejo/1.jpg?sig=a", reportedAt: "2026-11-05T11:50:00Z" }],
};
const SIN_FOTO: ExcluidoCotejo = {
  ...FALTA, dispatchId: 104, sequenceOrder: 4, sourceOrderRef: "SO-1043", trackingCode: null, contactName: null,
  failures: [{ packageId: "PKG-0002", reason: "missing", detail: null, photoUrl: null, reportedAt: "2026-11-05T11:52:00Z" }],
};

const conflicto = (code: string) => Object.assign(new Error(code), {
  isAxiosError: true, response: { status: 409, data: { statusCode: 409, error: code, message: code } }, config: {},
});

let excluidos: ExcluidoCotejo[] = [];
let falloPost: string | null = null;

const usuario = (rolId: number) => useAuthStore.setState({
  user: { id: 1, rol: { id: rolId, nombre: rolId === 1 ? "coordinator" : "supervisor" } } as never,
});

beforeEach(() => {
  excluidos = [FALTA, SIN_FOTO];
  falloPost = null;
  toastExito.mockReset();
  usuario(1);
  vi.spyOn(api, "get").mockImplementation(async (ruta: string) => {
    if (ruta === "/route-batches/cotejo-exclusions") return { data: { data: excluidos } };
    if (ruta.endsWith("/detail")) return { data: detalle };
    if (ruta === "/reschedule-reasons") return { data: { data: [], meta: { page: 1, limit: 100, total: 0, pages: 1 } } };
    return { data: [] };
  });
  vi.spyOn(api, "post").mockImplementation(async (ruta: string) => {
    if (falloPost) throw conflicto(falloPost);
    const id = Number(ruta.split("/")[2]);
    excluidos = excluidos.filter((p) => p.dispatchId !== id);
    if (ruta.endsWith("/cancel")) return { data: { dispatchId: id, status: "cancelled", previousStatus: "assigned", closedAt: "2026-11-05T12:00:00Z", reasonCode: "COORD-CANCELLED", routeBatchId: 42, routeBatchClosed: false } };
    return { data: { dispatchId: id, routeBatchId: 42, resolvedAt: "2026-11-05T12:00:00Z" } };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const cliente = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

/** Arma el panel igual que la página de Despachos, sin el modal de reprogramar (lo cubre su propia prueba). */
function Panel({ puedeActuar = true, onReprogramar = vi.fn() }: { puedeActuar?: boolean; onReprogramar?: (p: ExcluidoCotejo) => void }) {
  const lista = useExcluidosCotejo();
  const cancelar = useCancelarDespacho();
  const resolver = useResolverCotejo();
  const [accion, setAccion] = useState<{ tipo: "cancelar" | "resolver"; parada: ExcluidoCotejo } | null>(null);
  const cerrar = () => setAccion(null);
  const error = (e: unknown) => (e ? reglas.mensajeErrorAccionCotejo(parseApiError(e)) : null);
  return (
    <>
      <ExcluidosCotejoPanel
        data={lista.data ?? []} cargando={lista.isPending} error={lista.isError ? lista.error : undefined}
        onReintentar={() => void lista.refetch()} actualizando={lista.isFetching} puedeActuar={puedeActuar}
        onReprogramar={onReprogramar} onCancelar={(parada) => setAccion({ tipo: "cancelar", parada })}
        onResolver={(parada) => setAccion({ tipo: "resolver", parada })} hrefFicha={(id) => `/app/despachos/${id}`}
      />
      <CancelarDespachoDialog abierto={accion?.tipo === "cancelar"} onOpenChange={(a) => !a && cerrar()} codigo="DSP-2026-00103"
        enviando={cancelar.isPending} error={error(cancelar.error)}
        onConfirmar={(causal) => accion && cancelar.mutate({ id: accion.parada.dispatchId, causal }, { onSuccess: cerrar })} />
      <MarcarResueltoDialog abierto={accion?.tipo === "resolver"} onOpenChange={(a) => !a && cerrar()} codigo="DSP-2026-00103"
        enviando={resolver.isPending} error={error(resolver.error)}
        onConfirmar={(nota) => accion && resolver.mutate({ id: accion.parada.dispatchId, nota }, { onSuccess: cerrar })} />
    </>
  );
}

function abrirPanel(props: Parameters<typeof Panel>[0] = {}) {
  render(<QueryClientProvider client={cliente()}><MemoryRouter><Panel {...props} /></MemoryRouter></QueryClientProvider>);
}
const parada = (codigo: string) => screen.getByRole("listitem", { name: `Parada ${codigo}` });

describe("reglas de cancelación y cotejo (ST-241.4)", () => {
  it("solo se cancela antes de que salga la ruta", () => {
    for (const estado of ["pending", "address_review", "in_planning", "scheduled", "assigned"]) expect(reglas.puedeCancelar(estado)).toBe(true);
    for (const estado of ["out_for_delivery", "in_transit", "delivered", "incident", "not_delivered", "cancelled"]) {
      expect(reglas.puedeCancelar(estado)).toBe(false);
      expect(reglas.motivoNoCancelable(estado)).toContain("antes de que salga la ruta");
    }
    expect(reglas.motivoNoCancelable("assigned")).toBeNull();
  });

  it("explica motivos de falla y errores del back en palabras del coordinador", () => {
    expect(reglas.etiquetaMotivoFalla("does_not_fit")).toBe("No cabe en el vehículo");
    expect(reglas.etiquetaMotivoFalla("otro_motivo")).toBe("otro_motivo");
    expect(reglas.mensajeErrorAccionCotejo(parseApiError(conflicto("COTEJO_EXCLUSION_NOT_PENDING")))).toBe("Esta parada ya estaba resuelta.");
    expect(reglas.mensajeErrorAccionCotejo(parseApiError(conflicto("DISPATCH_CANCEL_NOT_ALLOWED")))).toContain("ya no se puede cancelar");
    expect(reglas.codigoParada(SIN_FOTO)).toBe("SO-1043");
  });
});

describe("panel «Excluidos por cotejo» (ST-241.4)", () => {
  it("muestra cada parada con lote, motivo, detalle y foto, y el link a la ficha", async () => {
    abrirPanel();
    const p = await screen.findByRole("listitem", { name: "Parada DSP-2026-00103" });
    expect(within(p).getByText("Bulto dañado")).toBeTruthy();
    expect(within(p).getByText("La caja llegó aplastada.")).toBeTruthy();
    expect(p.textContent).toContain("Lote #42");
    expect(p.textContent).toContain("parada 3");
    expect(within(p).getByRole("link", { name: "Ver ficha de DSP-2026-00103" }).getAttribute("href")).toBe("/app/despachos/103");
    expect(within(p).getByRole("button", { name: "Ver foto del bulto PKG-0001" })).toBeTruthy();
    const sinFoto = parada("SO-1043");
    expect(within(sinFoto).getByText("Falta el bulto")).toBeTruthy();
    expect(within(sinFoto).getByText("Sin foto")).toBeTruthy();
  });

  it("sin excluidos no ocupa lugar y el supervisor ve las paradas sin acciones", async () => {
    excluidos = [];
    abrirPanel();
    await waitFor(() => expect(vi.mocked(api.get)).toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: "Excluidos por cotejo" })).toBeNull();
    cleanup();
    excluidos = [FALTA];
    abrirPanel({ puedeActuar: false });
    await screen.findByRole("listitem", { name: "Parada DSP-2026-00103" });
    expect(screen.queryByRole("button", { name: /Cancelar|Reprogramar|Marcar resuelto/ })).toBeNull();
  });

  it("cancelar exige causal y saca la parada de la lista", async () => {
    const u = userEvent.setup();
    abrirPanel();
    await u.click(within(await screen.findByRole("listitem", { name: "Parada DSP-2026-00103" })).getByRole("button", { name: /Cancelar/ }));
    const form = screen.getByRole("form", { name: "Cancelar despacho" });
    const confirmar = within(form).getByRole("button", { name: /Cancelar despacho/ });
    expect(confirmar.hasAttribute("disabled")).toBe(true);
    await u.type(within(form).getByLabelText("Causal de la cancelación"), "El bulto no apareció y el cliente lo confirmó.");
    await u.click(confirmar);
    await waitFor(() => expect(vi.mocked(api.post)).toHaveBeenCalledWith("/dispatches/103/cancel", { reason: "El bulto no apareció y el cliente lo confirmó." }, { skipErrorToast: true }));
    await waitFor(() => expect(screen.queryByRole("listitem", { name: "Parada DSP-2026-00103" })).toBeNull());
    expect(toastExito).toHaveBeenCalledWith("Despacho cancelado.");
  });

  it("marcar resuelto manda la nota y la parada sale de la lista", async () => {
    const u = userEvent.setup();
    abrirPanel();
    await u.click(within(await screen.findByRole("listitem", { name: "Parada DSP-2026-00103" })).getByRole("button", { name: /Marcar resuelto/ }));
    const form = screen.getByRole("form", { name: "Marcar cotejo resuelto" });
    await u.type(within(form).getByLabelText("Nota (opcional)"), "Estaba en otra estantería.");
    await u.click(within(form).getByRole("button", { name: /Marcar resuelto/ }));
    await waitFor(() => expect(vi.mocked(api.post)).toHaveBeenCalledWith("/dispatches/103/cotejo-resolved", { note: "Estaba en otra estantería." }, { skipErrorToast: true }));
    await waitFor(() => expect(screen.queryByRole("listitem", { name: "Parada DSP-2026-00103" })).toBeNull());
  });

  it("si otro ya la resolvió, lo explica en el modal y recarga la lista", async () => {
    const u = userEvent.setup();
    falloPost = "COTEJO_EXCLUSION_NOT_PENDING";
    abrirPanel();
    await u.click(within(await screen.findByRole("listitem", { name: "Parada DSP-2026-00103" })).getByRole("button", { name: /Marcar resuelto/ }));
    const llamadasAntes = vi.mocked(api.get).mock.calls.length;
    await u.click(within(screen.getByRole("form", { name: "Marcar cotejo resuelto" })).getByRole("button", { name: /Marcar resuelto/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Esta parada ya estaba resuelta.");
    await waitFor(() => expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(llamadasAntes));
  });

  it("reprogramar abre el modal de la 52.1 con la parada elegida", async () => {
    const u = userEvent.setup();
    const onReprogramar = vi.fn();
    abrirPanel({ onReprogramar });
    await u.click(within(await screen.findByRole("listitem", { name: "Parada DSP-2026-00103" })).getByRole("button", { name: /Reprogramar/ }));
    expect(onReprogramar).toHaveBeenCalledWith(FALTA);
  });
});

let detalle: DespachoDetalle;
const DETALLE: DespachoDetalle = {
  id: 103, trackingCode: "DSP-2026-00103", sourceOrderRef: "SO-1042", type: { id: 1, name: "delivery" },
  status: { id: 4, name: "assigned" }, priority: "normal", serviceLevel: null, evidencePolicy: "hand_delivery_standard",
  paymentStatusLabel: null, scheduledWindowStart: null, scheduledWindowEnd: null, createdAt: "2026-11-01T10:00:00Z",
  destination: { address: "Av. Arce 2345", reference: null, latitude: null, longitude: null, contactName: "María López", contactPhone: null, zone: null },
  packages: [], route: null, receiver: null, timeline: [], incidents: [], reschedules: [], evidences: [],
};

function abrirFicha() {
  render(
    <QueryClientProvider client={cliente()}>
      <MemoryRouter initialEntries={["/app/despachos/103"]}>
        <Routes><Route path="/app/despachos/:id" element={<DespachoDetallePage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("cancelar desde la ficha 360° (ST-241.4)", () => {
  it("con el despacho asignado, cancela con causal", async () => {
    detalle = DETALLE;
    const u = userEvent.setup();
    abrirFicha();
    await u.click(await screen.findByRole("button", { name: /Cancelar despacho/ }));
    const form = screen.getByRole("form", { name: "Cancelar despacho" });
    await u.type(within(form).getByLabelText("Causal de la cancelación"), "Pedido duplicado.");
    await u.click(within(form).getByRole("button", { name: /Cancelar despacho/ }));
    await waitFor(() => expect(vi.mocked(api.post)).toHaveBeenCalledWith("/dispatches/103/cancel", { reason: "Pedido duplicado." }, { skipErrorToast: true }));
  });

  it("si la ruta ya salió, el botón está bloqueado y dice por qué", async () => {
    detalle = { ...DETALLE, status: { id: 6, name: "in_transit" } };
    abrirFicha();
    const boton = await screen.findByRole("button", { name: /Cancelar despacho/ });
    expect(boton.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Solo se cancela antes de que salga la ruta/)).toBeTruthy();
  });

  it("el supervisor no ve la acción", async () => {
    detalle = DETALLE;
    usuario(2);
    abrirFicha();
    await screen.findByRole("button", { name: /Reprogramar/ });
    expect(screen.queryByRole("button", { name: /Cancelar despacho/ })).toBeNull();
  });
});
