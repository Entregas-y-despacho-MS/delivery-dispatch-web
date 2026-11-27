// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { EventoAuditoria } from "@/domains/auditoria";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
const auditoria = await import("@/domains/auditoria");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: AuditoriaPage } = await import("@/pages/dashboard/auditoria-page");

const evento = (e: Partial<EventoAuditoria> & Pick<EventoAuditoria, "eventId">): EventoAuditoria => ({
  occurredAt: "2026-11-24T18:05:32.000Z", actorId: 4, actorRole: "admin", action: "user.role_changed",
  entityType: "user", entityId: "12", result: "success", statusCode: 200, correlationId: "req-12345678", ...e,
});
const CAMBIO_ROL = evento({ eventId: "e-1" });
const DENEGADO = evento({ eventId: "e-2", actorId: 7, actorRole: "coordinator", action: "setting.updated", entityType: "setting", entityId: "max_wait_time_min", result: "denied", statusCode: 403, correlationId: "req-87654321" });

let get: ReturnType<typeof vi.fn>;
const pedidos = () => get.mock.calls.map(([, config]) => config.params);

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  get = vi.fn(async () => ({ data: { data: [CAMBIO_ROL, DENEGADO], meta: { page: 1, limit: 20, pages: 3, total: 45 } } }));
  vi.spyOn(api, "get").mockImplementation(get as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Ubicacion() {
  const { search } = useLocation();
  return <output data-testid="ubicacion">{search}</output>;
}

function abrir(ruta = "/app/auditoria") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <AuditoriaPage />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const tabla = () => within(screen.getAllByRole("table")[0]);
const url = () => screen.getByTestId("ubicacion").textContent ?? "";

describe("reglas de la búsqueda de auditoría (ST-70.2)", () => {
  it("por defecto busca los últimos 7 días de Bolivia, del más reciente al más antiguo", () => {
    const filtros = auditoria.leerFiltrosAuditoria(new URLSearchParams());
    expect(filtros).toMatchObject({ desde: "2026-11-19", hasta: "2026-11-25", orden: "desc", pagina: 1 });
  });

  it("convierte los días de Bolivia en una ventana [desde, día siguiente) con la zona explícita", () => {
    const filtros = auditoria.leerFiltrosAuditoria(new URLSearchParams("desde=2026-11-20&hasta=2026-11-22&actor=4&rol=admin&accion=user.created&entidad=user&idEntidad=12&resultado=denied&correlacion=req-12345678&orden=asc&pagina=2"));
    expect(auditoria.paramsAuditoria(filtros)).toEqual({
      from: "2026-11-20T00:00:00-04:00", to: "2026-11-23T00:00:00-04:00", page: 2, limit: 20, order: "asc",
      actorId: 4, actorRole: "admin", action: "user.created", entityType: "user", entityId: "12", result: "denied", correlationId: "req-12345678",
    });
  });

  it("ignora lo inválido de la URL y detecta lo que el back rechazaría", () => {
    const raros = auditoria.leerFiltrosAuditoria(new URLSearchParams("desde=ayer&rol=jefe&accion=user.exploded&resultado=quizas&orden=costado&pagina=0"));
    expect(raros).toMatchObject({ desde: "2026-11-19", rol: null, accion: null, resultado: null, orden: "desc", pagina: 1 });
    const base = auditoria.filtrosAuditoriaPorDefecto();
    expect(auditoria.problemaFiltrosAuditoria({ ...base, desde: "2026-11-26" })).toBe("rango-invertido");
    expect(auditoria.problemaFiltrosAuditoria({ ...base, desde: "2026-10-25" })).toBe("rango-largo");
    expect(auditoria.problemaFiltrosAuditoria({ ...base, desde: "2026-10-26" })).toBeNull();
    expect(auditoria.problemaFiltrosAuditoria({ ...base, idEntidad: "12" })).toBe("id-sin-entidad");
    expect(auditoria.problemaFiltrosAuditoria({ ...base, correlacion: "corto" })).toBe("correlacion-invalida");
  });

  it("muestra la hora de Bolivia con la zona explícita", () => {
    expect(auditoria.formatearHoraAuditoria("2026-11-24T18:05:32.000Z")).toBe("24/11/2026, 14:05:32 (BOT, UTC−4)");
  });
});

describe("pantalla de auditoría (ST-70.2)", () => {
  it("lista los eventos con hora, actor y rol, acción, objeto, resultado y correlación", async () => {
    abrir();
    await screen.findAllByText("req-12345678");
    expect(pedidos()[0]).toEqual({ from: "2026-11-19T00:00:00-04:00", to: "2026-11-26T00:00:00-04:00", page: 1, limit: 20, order: "desc" });
    const fila = within(tabla().getAllByRole("row")[1]);
    expect(fila.getByText("24/11/2026, 14:05:32 (BOT, UTC−4)")).toBeTruthy();
    expect(fila.getByText("Usuario #4")).toBeTruthy();
    expect(fila.getByText("Administrador")).toBeTruthy();
    expect(fila.getByText("Usuario #12")).toBeTruthy();
    expect(fila.getByText("Exitoso")).toBeTruthy();
    expect(fila.getByText("req-12345678")).toBeTruthy();
    expect(tabla().getByText("Denegado")).toBeTruthy();
    expect(screen.getByText("45 eventos en el período")).toBeTruthy();
  });

  it("los filtros se mandan al back, quedan en la URL y vuelven a la página 1", async () => {
    const user = userEvent.setup();
    abrir("/app/auditoria?pagina=2");
    await screen.findAllByText("req-12345678");
    await user.selectOptions(screen.getByLabelText("Acción"), "setting.updated");
    await user.selectOptions(screen.getByLabelText("Resultado"), "denied");
    await user.selectOptions(screen.getByLabelText("Entidad"), "setting");
    await user.type(screen.getByLabelText("ID de la entidad"), "max_wait_time_min");
    await waitFor(() => expect(pedidos().at(-1)).toMatchObject({
      page: 1, action: "setting.updated", result: "denied", entityType: "setting", entityId: "max_wait_time_min",
    }));
    // El período siempre queda escrito: el link compartido abre la misma búsqueda aunque cambie el día.
    const enUrl = new URLSearchParams(url());
    expect(Object.fromEntries(enUrl)).toEqual({
      desde: "2026-11-19", hasta: "2026-11-25", accion: "setting.updated", resultado: "denied", entidad: "setting", idEntidad: "max_wait_time_min",
    });
  });

  it("al volver del detalle conserva los filtros y la página", async () => {
    const user = userEvent.setup();
    abrir("/app/auditoria?accion=user.role_changed&pagina=2");
    await screen.findAllByText("req-12345678");
    await user.click(tabla().getAllByRole("button", { name: /Ver detalle del evento Cambio de rol/ })[0]);
    const detalle = within(await screen.findByRole("dialog"));
    expect(detalle.getByText("req-12345678")).toBeTruthy();
    expect(detalle.getByText("e-1")).toBeTruthy();
    expect(url()).toContain("evento=e-1");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(Object.fromEntries(new URLSearchParams(url()))).toEqual({ accion: "user.role_changed", pagina: "2" });
    expect(pedidos().every((p) => p.page === 2 && p.action === "user.role_changed")).toBe(true);
  });

  it("con un rango inválido avisa y no consulta al back", async () => {
    abrir("/app/auditoria?desde=2026-11-25&hasta=2026-11-20");
    expect(await screen.findByText("La fecha «Desde» no puede ser posterior a «Hasta».")).toBeTruthy();
    expect(get).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Desde (hora de Bolivia)"), { target: { value: "2026-11-18" } });
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  });

  it("un período sin eventos muestra el estado vacío, distinto del error", async () => {
    get.mockResolvedValueOnce({ data: { data: [], meta: { page: 1, limit: 20, pages: 0, total: 0 } } });
    abrir();
    expect((await screen.findAllByText("No hubo acciones administrativas en el período elegido.")).length).toBeGreaterThan(0);
    expect(screen.queryByText("No pudimos cargar la auditoría")).toBeNull();
  });

  it("cambia de página manteniendo los filtros", async () => {
    const user = userEvent.setup();
    abrir("/app/auditoria?resultado=success");
    await screen.findAllByText("req-12345678");
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    await waitFor(() => expect(pedidos().at(-1)).toMatchObject({ page: 2, result: "success" }));
    expect(url()).toContain("pagina=2");
  });
});
