// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CambiarEstadoDialog } from "./cambiar-estado-dialog";
import { vehiculosService } from "../services/vehiculos.service";
import type { Vehiculo } from "../flota.types";

Element.prototype.scrollIntoView = () => undefined;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => undefined;
HTMLElement.prototype.releasePointerCapture = () => undefined;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const vehiculo: Vehiculo = {
  id: 7,
  type: "camioneta",
  model: "Toyota Hilux",
  plate: "ABC-123",
  capacityKg: 1200,
  capacityM3: 8.5,
  vehicleStatus: { id: 1, name: "active" },
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function seleccionarMantenimiento(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Nuevo estado" }));
  await user.click(await screen.findByRole("option", { name: "Mantenimiento" }));
}

function renderDialog(props: Parameters<typeof CambiarEstadoDialog>[0]) {
  return render(<MemoryRouter><CambiarEstadoDialog {...props} /></MemoryRouter>);
}

describe("CambiarEstadoDialog", () => {
  it("envía el nuevo estado y el motivo sin espacios sobrantes", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn().mockResolvedValue(undefined);
    renderDialog({ abierto: true, vehiculo, guardando: false, onOpenChange: vi.fn(), onConfirmar });

    await seleccionarMantenimiento(user);
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "  Revisión preventiva  ");
    await user.click(screen.getByRole("button", { name: "Guardar estado" }));

    expect(onConfirmar).toHaveBeenCalledWith({ status: "maintenance", reason: "Revisión preventiva" });
  });

  it("exige un motivo antes de llamar al endpoint", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn();
    renderDialog({ abierto: true, vehiculo, guardando: false, onOpenChange: vi.fn(), onConfirmar });

    await seleccionarMantenimiento(user);
    await user.click(screen.getByRole("button", { name: "Guardar estado" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Escribe el motivo del cambio de estado.");
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("muestra IDs y fechas de los lotes devueltos por el 409", async () => {
    const user = userEvent.setup();
    vi.spyOn(vehiculosService, "getRouteBatchStatus").mockResolvedValue("in_execution");
    const onConfirmar = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          error: "VEHICLE_HAS_ACTIVE_BATCHES",
          message: "The vehicle has active route batches.",
          details: { batches: [{ id: 42, shiftDate: "2026-11-06" }] },
        },
      },
    });
    renderDialog({ abierto: true, vehiculo, guardando: false, onOpenChange: vi.fn(), onConfirmar });

    await seleccionarMantenimiento(user);
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Ingreso a taller");
    await user.click(screen.getByRole("button", { name: "Guardar estado" }));

    expect((await screen.findByRole("alert", { name: "Lotes que impiden cambiar el estado" })).textContent).toContain("Lote #42 · 2026-11-06 · En ejecución");
    expect(screen.getByRole("link", { name: "Abrir mapa para reasignar" }).getAttribute("href")).toBe("/app/mapa");
  });

  it("muestra el aviso de lote confirmado sin ofrecer una acción de cambio no soportada", async () => {
    const user = userEvent.setup();
    vi.spyOn(vehiculosService, "getRouteBatchStatus").mockResolvedValue("confirmed");
    const onConfirmar = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          error: "VEHICLE_HAS_ACTIVE_BATCHES",
          message: "The vehicle has active route batches.",
          details: { batches: [{ id: 52, shiftDate: "2026-11-07" }] },
        },
      },
    });
    renderDialog({ abierto: true, vehiculo, guardando: false, onOpenChange: vi.fn(), onConfirmar });

    await seleccionarMantenimiento(user);
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Ingreso a taller");
    await user.click(screen.getByRole("button", { name: "Guardar estado" }));

    expect((await screen.findByRole("alert", { name: "Lotes que impiden cambiar el estado" })).textContent).toContain("El lote confirmado no permite cambiar el vehículo desde esta pantalla.");
    expect(screen.queryByRole("link", { name: /Cambiar vehículo/ })).toBeNull();
  });
});
