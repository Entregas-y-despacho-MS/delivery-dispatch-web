// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CambiarVehiculoDialog } from "./cambiar-vehiculo-dialog";

Element.prototype.scrollIntoView = () => undefined;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => undefined;
HTMLElement.prototype.releasePointerCapture = () => undefined;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CambiarVehiculoDialog", () => {
  it("exige motivo para cambiar el vehículo de un lote confirmado", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn();
    render(
      <MemoryRouter>
        <CambiarVehiculoDialog
          abierto
          onOpenChange={vi.fn()}
          vehiculoActualId={7}
          opciones={[{ id: 8, etiqueta: "DEF-456 · Hyundai H100", capacidadKg: 1800, capacidadM3: 12 }]}
          guardando={false}
          requiereMotivo
          onConfirmar={onConfirmar}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("combobox", { name: "Vehículo" }));
    await user.click(await screen.findByRole("option", { name: "DEF-456 · Hyundai H100" }));
    await user.click(screen.getByRole("button", { name: "Cambiar vehículo" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Escribe el motivo del cambio de vehículo.");
    expect(onConfirmar).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "  Vehículo en mantenimiento  ");
    await user.click(screen.getByRole("button", { name: "Cambiar vehículo" }));

    expect(onConfirmar).toHaveBeenCalledWith(8, "Vehículo en mantenimiento");
  });
});
