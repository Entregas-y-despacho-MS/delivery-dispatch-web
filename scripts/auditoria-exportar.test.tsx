// @vitest-environment jsdom
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const { default: api } = await import("@/shared/lib/axios");
const auditoria = await import("@/domains/auditoria");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: AuditoriaPage } = await import("@/pages/dashboard/auditoria-page");

const EVENTO = {
  eventId: "e-1", occurredAt: "2026-11-24T18:05:32.000Z", actorId: 4, actorRole: "admin", action: "user.role_changed",
  entityType: "user", entityId: "12", result: "success", statusCode: 200, correlationId: "req-12345678",
};
const lista = (total: number) => ({ data: { data: [EVENTO], meta: { page: 1, limit: 20, pages: Math.ceil(total / 20), total } } });

/** Error del back con el cuerpo como Blob, igual que llega con responseType "blob". */
function errorBlob(status: number, code: string) {
  const config = { url: "/audit/admin-events/export", headers: new AxiosHeaders() };
  const data = new Blob([JSON.stringify({ statusCode: status, error: code, message: "x" })], { type: "application/json" });
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, { status, statusText: "", data, headers: {}, config });
}

let get: ReturnType<typeof vi.fn>;
let descargas: string[];
const exportaciones = () => get.mock.calls.filter(([ruta]) => ruta === "/audit/admin-events/export");

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
  URL.createObjectURL = vi.fn(() => "blob:auditoria");
  URL.revokeObjectURL = vi.fn();
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  descargas = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { descargas.push(this.download); });
  get = vi.fn(async (ruta: string) => (ruta === "/audit/admin-events/export" ? { data: new Blob(["a,b"]) } : lista(45)));
  vi.spyOn(api, "get").mockImplementation(get as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toast.success.mockClear();
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

describe("reglas de la exportación (ST-71.2)", () => {
  it("el nombre lleva el período y el formato, y conoce los límites del back", () => {
    expect(auditoria.nombreArchivoAuditoria({ desde: "2026-11-19", hasta: "2026-11-25" }, "pdf")).toBe("auditoria-admin_2026-11-19_a_2026-11-25.pdf");
    expect(auditoria.excedeLimite(10_000, "csv")).toBe(false);
    expect(auditoria.excedeLimite(10_001, "csv")).toBe(true);
    expect(auditoria.excedeLimite(2_001, "pdf")).toBe(true);
  });
});

describe("exportar la búsqueda de auditoría (ST-71.2)", () => {
  it("cada formato manda exactamente la consulta de la pantalla y descarga con su nombre", async () => {
    const user = userEvent.setup();
    abrir("/app/auditoria?accion=user.role_changed&orden=asc&desde=2026-11-20&hasta=2026-11-22");
    await screen.findAllByText("req-12345678");
    await user.click(screen.getByRole("button", { name: "Exportar en CSV" }));
    await waitFor(() => expect(descargas).toEqual(["auditoria-admin_2026-11-20_a_2026-11-22.csv"]));
    const [, config] = exportaciones()[0];
    expect(config.params).toEqual({
      from: "2026-11-20T00:00:00-04:00", to: "2026-11-23T00:00:00-04:00", page: 1, limit: 20, order: "asc", action: "user.role_changed", format: "csv",
    });
    expect(config.responseType).toBe("blob");
    await user.click(screen.getByRole("button", { name: "Exportar en PDF" }));
    await waitFor(() => expect(descargas.at(-1)).toBe("auditoria-admin_2026-11-20_a_2026-11-22.pdf"));
    expect(exportaciones()[1][1].params.format).toBe("pdf");
    expect(toast.success).toHaveBeenCalledWith("Descargado auditoria-admin_2026-11-20_a_2026-11-22.pdf");
  });

  it("muestra el progreso mientras se genera", async () => {
    let terminar: (valor: unknown) => void = () => undefined;
    get.mockImplementation(async (ruta: string) => (ruta === "/audit/admin-events/export" ? new Promise((r) => { terminar = r; }) : lista(45)));
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("req-12345678");
    await user.click(screen.getByRole("button", { name: "Exportar en PDF" }));
    expect(await screen.findByText(/Generando PDF/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Exportar en CSV" }) as HTMLButtonElement).disabled).toBe(true);
    terminar({ data: new Blob(["%PDF"]) });
    await waitFor(() => expect(screen.queryByText(/Generando PDF/)).toBeNull());
  });

  it("si el resultado supera el límite del formato, avisa sin pedir el archivo", async () => {
    get.mockImplementation(async () => lista(2_500));
    const user = userEvent.setup();
    abrir();
    await screen.findAllByText("req-12345678");
    await user.click(screen.getByRole("button", { name: "Exportar en PDF" }));
    expect(await screen.findByText(/El PDF admite hasta 2\.000 eventos/)).toBeTruthy();
    expect(exportaciones()).toHaveLength(0);
  });

  it("si el back rechaza (límite o PDF fallido), explica cómo seguir y conserva los filtros", async () => {
    get.mockImplementation(async (ruta: string) => {
      if (ruta === "/audit/admin-events/export") throw errorBlob(500, "PDF_GENERATION_FAILED");
      return lista(45);
    });
    const user = userEvent.setup();
    abrir("/app/auditoria?resultado=denied");
    await screen.findAllByText("req-12345678");
    await user.click(screen.getByRole("button", { name: "Exportar en PDF" }));
    expect(await screen.findByText("No se pudo generar el PDF. Intenta de nuevo o exporta en CSV.")).toBeTruthy();
    expect((screen.getByLabelText("Resultado") as HTMLSelectElement).value).toBe("denied");
    expect(descargas).toHaveLength(0);
  });

  it("sin eventos no ofrece exportar", async () => {
    get.mockImplementation(async () => ({ data: { data: [], meta: { page: 1, limit: 20, pages: 0, total: 0 } } }));
    abrir();
    await screen.findAllByText(/No hubo acciones administrativas/);
    expect((screen.getByRole("button", { name: "Exportar en CSV" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
