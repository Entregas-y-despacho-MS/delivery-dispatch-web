// @vitest-environment jsdom
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { EventoAuditoria } from "@/domains/auditoria";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { default: api } = await import("@/shared/lib/axios");
const { PORTAL_ROUTES } = await import("@/config/portal-routes");
const { hasRole, ROLES } = await import("@/config/roles");
const { navigationForRole } = await import("@/config/navigation");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: AuditoriaPage } = await import("@/pages/dashboard/auditoria-page");

const evento = (e: Partial<EventoAuditoria> & Pick<EventoAuditoria, "eventId">): EventoAuditoria => ({
  occurredAt: "2026-11-24T18:05:32.000Z", actorId: 4, actorRole: "admin", action: "user.role_changed",
  entityType: "user", entityId: "12", result: "success", statusCode: 200, correlationId: "req-12345678", ...e,
});
const pagina = (data: EventoAuditoria[], page: number, pages: number, total: number) =>
  ({ data: { data, meta: { page, limit: 20, pages, total } } });

function errorHttp(status: number, code: string) {
  const config = { url: "/audit/admin-events", headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, {
    status, statusText: "", data: { statusCode: status, error: code, message: "x" }, headers: {}, config,
  });
}

let get: ReturnType<typeof vi.fn>;
const pedidos = () => get.mock.calls.map(([, config]) => config.params);

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  get = vi.fn(async () => pagina([evento({ eventId: "e-1" })], 1, 1, 1));
  vi.spyOn(api, "get").mockImplementation(get as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function abrir(ruta = "/app/auditoria") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <AuditoriaPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const titulosMenu = (rol: number) => navigationForRole(rol).flatMap((g) => g.items.map((i) => i.title));

describe("permisos de la auditoría (ST-70.3)", () => {
  it("solo el administrador y root pueden abrir la pantalla, igual que el back", () => {
    expect(hasRole(ROLES.ADMIN, PORTAL_ROUTES.auditoria.roles)).toBe(true);
    expect(hasRole(ROLES.ROOT, PORTAL_ROUTES.auditoria.roles)).toBe(true);
    for (const rol of [ROLES.COORDINADOR, ROLES.SUPERVISOR, ROLES.REPARTIDOR]) {
      expect(hasRole(rol, PORTAL_ROUTES.auditoria.roles)).toBe(false);
    }
  });

  it("el menú muestra Auditoría solo al administrador", () => {
    expect(titulosMenu(ROLES.ADMIN)).toContain("Auditoría");
    expect(titulosMenu(ROLES.COORDINADOR)).not.toContain("Auditoría");
    expect(titulosMenu(ROLES.SUPERVISOR)).not.toContain("Auditoría");
  });

  it("si el back rechaza (403), avisa sin mostrar ningún dato", async () => {
    get.mockRejectedValue(errorHttp(403, "INSUFFICIENT_PERMISSIONS"));
    abrir();
    expect(await screen.findByText("No tienes permiso para consultar la auditoría. Solo el administrador puede verla.")).toBeTruthy();
    expect(screen.queryByText("req-12345678")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("rangos, vacío y error (ST-70.3)", () => {
  it("un rango válido de 31 días consulta; uno de 32 o invertido no", async () => {
    abrir("/app/auditoria?desde=2026-10-26&hasta=2026-11-25");
    await waitFor(() => expect(pedidos()[0]).toMatchObject({ from: "2026-10-26T00:00:00-04:00", to: "2026-11-26T00:00:00-04:00" }));
    cleanup();
    get.mockClear();
    abrir("/app/auditoria?desde=2026-10-25&hasta=2026-11-25");
    expect(await screen.findByText(/no puede pasar de 31 días/)).toBeTruthy();
    cleanup();
    abrir("/app/auditoria?desde=2026-11-25&hasta=2026-11-24");
    expect(await screen.findByText(/no puede ser posterior/)).toBeTruthy();
    expect(get).not.toHaveBeenCalled();
  });

  it("si el back igual rechaza el rango (400), lo explica", async () => {
    get.mockRejectedValue(errorHttp(400, "INVALID_AUDIT_RANGE"));
    abrir();
    expect(await screen.findByText(/El rango de fechas no es válido/)).toBeTruthy();
  });

  it("el vacío no es un error y el error ofrece reintentar", async () => {
    get.mockResolvedValueOnce(pagina([], 1, 0, 0));
    abrir();
    expect((await screen.findAllByText(/No hubo acciones administrativas/)).length).toBeGreaterThan(0);
    expect(screen.queryByText("No pudimos cargar la auditoría")).toBeNull();
    cleanup();
    get.mockRejectedValueOnce(errorHttp(500, "INTERNAL"));
    const user = userEvent.setup();
    abrir();
    expect(await screen.findByText("No pudimos cargar la auditoría")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect((await screen.findAllByText("req-12345678")).length).toBeGreaterThan(0);
  });
});

describe("páginas y orden (ST-70.3)", () => {
  it("recorre varias páginas sin repetir eventos y con el orden pedido", async () => {
    get.mockImplementation(async (_ruta: string, config: { params: { page: number } }) =>
      config.params.page === 1
        ? pagina([evento({ eventId: "e-3", correlationId: "req-pagina-1" })], 1, 2, 2)
        : pagina([evento({ eventId: "e-2", correlationId: "req-pagina-2" })], 2, 2, 2));
    const user = userEvent.setup();
    abrir("/app/auditoria?orden=asc");
    await screen.findAllByText("req-pagina-1");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findAllByText("req-pagina-2");
    expect(screen.queryByText("req-pagina-1")).toBeNull();
    expect(pedidos().map((p) => [p.page, p.order])).toEqual([[1, "asc"], [2, "asc"]]);
  });
});

describe("datos sensibles (ST-70.3)", () => {
  it("al administrador no le llegan la IP ni los datos del body, y la página no los inventa", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("req-12345678");
    await user.click(within(screen.getAllByRole("table")[0]).getByRole("button", { name: /Ver detalle/ }));
    const detalle = within(await screen.findByRole("dialog"));
    expect(detalle.queryByText("IP del cliente")).toBeNull();
    expect(detalle.queryByText("Datos registrados")).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
  });

  it("a root sí le muestra la IP y los campos declarados que manda el back", async () => {
    get.mockResolvedValue(pagina([evento({ eventId: "e-9", ip: "10.0.0.7", metadata: { roleId: 2 } })], 1, 1, 1));
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("req-12345678");
    await user.click(within(screen.getAllByRole("table")[0]).getByRole("button", { name: /Ver detalle/ }));
    const detalle = within(await screen.findByRole("dialog"));
    expect(detalle.getByText("10.0.0.7")).toBeTruthy();
    expect(detalle.getByText("roleId")).toBeTruthy();
  });
});
