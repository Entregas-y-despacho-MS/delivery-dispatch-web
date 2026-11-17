// @vitest-environment jsdom
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UmbralesAlertaGuardados } from "@/domains/configuracion";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const { default: api } = await import("@/shared/lib/axios");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan el esquema directamente.
const { umbralesSchema } = await import("@/domains/configuracion/schemas/configuracion.schemas");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la traducción de errores directamente.
const { errorGuardadoUmbrales } = await import("@/domains/configuracion/configuracion.umbrales");
// oxlint-disable-next-line no-restricted-imports -- las pruebas revisan la página completa.
const { default: UmbralesPortalPage } = await import("@/pages/dashboard/umbrales-portal-page");

const ACTUALES: UmbralesAlertaGuardados = {
  slaAlertMinOnTimePct: 90,
  gpsStaleAlertMinutes: 15,
  driverIncidentAlertPerDay: 3,
  updatedAt: "2026-11-01T14:30:00.000Z",
};

function errorHttp(status: number, data: unknown) {
  const config = { url: "/settings/alert-thresholds", headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, { status, statusText: "", data, headers: {}, config });
}

const VALIDOS = { slaAlertMinOnTimePct: "90", gpsStaleAlertMinutes: "15", driverIncidentAlertPerDay: "3" };

let put: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.spyOn(api, "get").mockResolvedValue({ data: ACTUALES });
  put = vi.fn(async (_ruta: string, cuerpo: object) => ({ data: { ...cuerpo, updatedAt: "2026-11-08T16:00:00.000Z" } }));
  vi.spyOn(api, "put").mockImplementation(put as never);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toast.success.mockClear();
});

function abrir() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/app/umbrales"]}>
        <UmbralesPortalPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const campo = (nombre: RegExp) => screen.getByLabelText(nombre) as HTMLInputElement;
const botonGuardar = () => screen.getByRole("button", { name: /guardar umbrales/i });

async function escribir(nombre: RegExp, valor: string) {
  const user = userEvent.setup();
  await user.clear(campo(nombre));
  if (valor) await user.type(campo(nombre), valor);
  return user;
}

describe("validaciones de umbrales de alerta (ST-67.2)", () => {
  it("acepta enteros dentro de los rangos del back, incluidos los extremos", () => {
    expect(umbralesSchema.safeParse(VALIDOS).success).toBe(true);
    expect(umbralesSchema.safeParse({ slaAlertMinOnTimePct: "0", gpsStaleAlertMinutes: "1", driverIncidentAlertPerDay: "1" }).success).toBe(true);
    expect(umbralesSchema.safeParse({ slaAlertMinOnTimePct: "100", gpsStaleAlertMinutes: "1440", driverIncidentAlertPerDay: "100" }).success).toBe(true);
  });

  it("rechaza vacío, decimales, negativos y valores fuera de rango, con el error en su campo", () => {
    const errores = (valores: Partial<typeof VALIDOS>) => {
      const r = umbralesSchema.safeParse({ ...VALIDOS, ...valores });
      return r.success ? {} : r.error.flatten().fieldErrors;
    };
    expect(errores({ slaAlertMinOnTimePct: "101" }).slaAlertMinOnTimePct).toEqual(["Ingresa un porcentaje entero entre 0 y 100."]);
    expect(errores({ gpsStaleAlertMinutes: "0" }).gpsStaleAlertMinutes?.[0]).toMatch(/entre 1 y 1440/);
    expect(errores({ gpsStaleAlertMinutes: "1441" }).gpsStaleAlertMinutes?.[0]).toMatch(/entre 1 y 1440/);
    expect(errores({ driverIncidentAlertPerDay: "2.5" }).driverIncidentAlertPerDay).toEqual(["Solo números enteros, sin decimales ni signos."]);
    expect(errores({ driverIncidentAlertPerDay: "-1" }).driverIncidentAlertPerDay?.[0]).toMatch(/enteros/);
    expect(errores({ slaAlertMinOnTimePct: "  " }).slaAlertMinOnTimePct?.[0]).toBe("Este campo es obligatorio.");
  });

  it("traduce los errores del back y ubica el campo cuando el back lo nombra", () => {
    expect(errorGuardadoUmbrales(errorHttp(400, {
      statusCode: 400, error: "INVALID_SETTING_VALUE", message: "gps_stale_alert_minutes must be a whole number of minutes from 1 to 1440.",
    }))).toEqual({ campo: "gpsStaleAlertMinutes", mensaje: expect.stringMatching(/entre 1 y 1440/) });
    expect(errorGuardadoUmbrales(errorHttp(400, {
      statusCode: 400, error: "Bad Request", message: ["slaAlertMinOnTimePct must not be greater than 100"],
    })).campo).toBe("slaAlertMinOnTimePct");
    expect(errorGuardadoUmbrales(errorHttp(403, { statusCode: 403, error: "FORBIDDEN", message: "Forbidden" })))
      .toEqual({ mensaje: "Solo el supervisor puede cambiar los umbrales de alerta." });
    expect(errorGuardadoUmbrales(errorHttp(404, { statusCode: 404, error: "SETTING_NOT_FOUND", message: "Setting not found." })).mensaje)
      .toMatch(/todavía no están configurados/);
    expect(errorGuardadoUmbrales(errorHttp(500, {})).mensaje).toMatch(/No se pudo guardar/);
  });
});

describe("página de umbrales de alerta (ST-67.2)", () => {
  it("precarga los valores actuales del back y deja el guardado bloqueado sin cambios", async () => {
    abrir();
    expect(await screen.findByDisplayValue("90")).toBeTruthy();
    expect(campo(/cumplimiento sla/i).value).toBe("90");
    expect(campo(/gps sin señal/i).value).toBe("15");
    expect(campo(/incidencias por repartidor/i).value).toBe("3");
    expect(screen.getByText(/último cambio/i)).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/settings/alert-thresholds", expect.anything());
    expect((botonGuardar() as HTMLButtonElement).disabled).toBe(true);
  });

  it("muestra el error bajo el campo y bloquea el guardado con un porcentaje fuera de 0 a 100", async () => {
    abrir();
    await screen.findByDisplayValue("90");
    await escribir(/cumplimiento sla/i, "150");
    expect(await screen.findByText("Ingresa un porcentaje entero entre 0 y 100.")).toBeTruthy();
    expect(campo(/cumplimiento sla/i).getAttribute("aria-invalid")).toBe("true");
    expect((botonGuardar() as HTMLButtonElement).disabled).toBe(true);
  });

  it("muestra el error con menos de 1 minuto de GPS", async () => {
    abrir();
    await screen.findByDisplayValue("15");
    await escribir(/gps sin señal/i, "0");
    expect(await screen.findByText(/entre 1 y 1440/)).toBeTruthy();
    expect((botonGuardar() as HTMLButtonElement).disabled).toBe(true);
  });

  it("guarda los tres umbrales como números, muestra el toast y actualiza el último cambio", async () => {
    abrir();
    await screen.findByDisplayValue("90");
    const user = await escribir(/cumplimiento sla/i, "85");
    await escribir(/gps sin señal/i, "20");
    await waitFor(() => expect((botonGuardar() as HTMLButtonElement).disabled).toBe(false));
    await user.click(botonGuardar());
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(
      "/settings/alert-thresholds",
      { slaAlertMinOnTimePct: 85, gpsStaleAlertMinutes: 20, driverIncidentAlertPerDay: 3 },
      expect.anything(),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Umbrales de alerta guardados."));
    // Con los valores guardados como nuevos actuales, ya no hay cambios pendientes.
    await waitFor(() => expect((botonGuardar() as HTMLButtonElement).disabled).toBe(true));
    expect(campo(/cumplimiento sla/i).value).toBe("85");
  });

  it("si el back rechaza un valor, muestra el error bajo ese campo y no muestra el toast", async () => {
    put.mockRejectedValueOnce(errorHttp(400, {
      statusCode: 400, error: "INVALID_SETTING_VALUE", message: "driver_incident_alert_per_day must be a whole number from 1 to 100.",
    }));
    abrir();
    await screen.findByDisplayValue("3");
    const user = await escribir(/incidencias por repartidor/i, "5");
    await waitFor(() => expect((botonGuardar() as HTMLButtonElement).disabled).toBe(false));
    await user.click(botonGuardar());
    expect(await screen.findByText("Ingresa un número entero de incidencias entre 1 y 100.")).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("«Descartar cambios» vuelve a los valores actuales", async () => {
    abrir();
    await screen.findByDisplayValue("90");
    const user = await escribir(/cumplimiento sla/i, "70");
    await user.click(screen.getByRole("button", { name: /descartar cambios/i }));
    await waitFor(() => expect(campo(/cumplimiento sla/i).value).toBe("90"));
  });

  it("si no puede cargar los umbrales, muestra el error con opción de reintentar", async () => {
    vi.spyOn(api, "get").mockRejectedValue(errorHttp(500, {}));
    abrir();
    expect(await screen.findByText("No pudimos cargar los umbrales")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /guardar umbrales/i })).toBeNull();
  });
});
