// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useLoteMock, useAccionesMock } = vi.hoisted(() => ({
  useLoteMock: vi.fn(),
  useAccionesMock: vi.fn(),
}));

vi.mock("../hooks/use-lotes", () => ({ useLote: useLoteMock }));
vi.mock("../hooks/use-acciones-lote", () => ({ useAccionesLote: useAccionesMock }));
vi.mock("./aprobar-promesas-dialog", () => ({ AprobarPromesasDialog: () => null }));
vi.mock("./lote-pedidos-table", () => ({ LotePedidosTable: () => null }));
vi.mock("./ocupacion-lote", () => ({ OcupacionLote: () => null }));
vi.mock("./reasignar-lote-dialog", () => ({ ReasignarLoteDialog: () => null }));
vi.mock("./sacar-pedido-dialog", () => ({ SacarPedidoDialog: () => null }));

import { LoteProvisionalDetalle } from "./lote-provisional-detalle";

Element.prototype.scrollIntoView = () => undefined;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => undefined;
HTMLElement.prototype.releasePointerCapture = () => undefined;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoteProvisionalDetalle — cambio de vehículo confirmado", () => {
  it("abre desde el deep link y envía vehículo, versión vigente y motivo", async () => {
    const user = userEvent.setup();
    const cambiarVehiculo = vi.fn((_payload: unknown, options: { onSuccess: () => void }) => options.onSuccess());
    const onAccionVehiculoConsumida = vi.fn();
    useLoteMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 52,
        status: "confirmed",
        version: 9,
        shiftDate: "2026-11-07",
        zone: { name: "Centro" },
        vehicle: { id: 7, plate: "ABC-123", model: "Toyota Hilux" },
        reviewer: { id: 1, fullName: "Sergio Mendoza" },
        dispatches: [],
        capacity: null,
        validation: null,
      },
      refetch: vi.fn(),
    });
    useAccionesMock.mockReturnValue({
      aprobarPromesas: vi.fn(),
      aprobando: false,
      cambiarVehiculo,
      cambiandoVehiculo: false,
      reasignarRevisor: vi.fn(),
      reasignando: false,
      ocupado: false,
    });

    render(
      <MemoryRouter>
        <LoteProvisionalDetalle
          loteId={52}
          usuarioId={1}
          vehiculos={[{ id: 8, etiqueta: "DEF-456 · Hyundai H100", capacidadKg: 1800, capacidadM3: 12 }]}
          revisores={[]}
          accionVehiculoSolicitada
          onAccionVehiculoConsumida={onAccionVehiculoConsumida}
          onCerrar={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Cambiar vehículo del lote" })).toBeTruthy();
    expect(onAccionVehiculoConsumida).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: "Vehículo" }));
    await user.click(await screen.findByRole("option", { name: "DEF-456 · Hyundai H100" }));
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Cambio preventivo");
    const buttons = screen.getAllByRole("button", { name: "Cambiar vehículo" });
    await user.click(buttons[buttons.length - 1]);

    expect(cambiarVehiculo).toHaveBeenCalledWith(
      { loteId: 52, vehicleId: 8, version: 9, reason: "Cambio preventivo" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(onAccionVehiculoConsumida).toHaveBeenCalledOnce();
  });

  it("si la ruta ya empezó, no abre el cambio de vehículo y conserva el acceso al mapa", async () => {
    const cambiarVehiculo = vi.fn();
    useLoteMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 52,
        status: "in_execution",
        version: 10,
        shiftDate: "2026-11-07",
        zone: { name: "Centro" },
        vehicle: { id: 7, plate: "ABC-123", model: "Toyota Hilux" },
        reviewer: { id: 1, fullName: "Sergio Mendoza" },
        dispatches: [],
        capacity: null,
        validation: null,
      },
      refetch: vi.fn(),
    });
    useAccionesMock.mockReturnValue({
      aprobarPromesas: vi.fn(),
      aprobando: false,
      cambiarVehiculo,
      cambiandoVehiculo: false,
      reasignarRevisor: vi.fn(),
      reasignando: false,
      ocupado: false,
    });

    render(
      <MemoryRouter>
        <LoteProvisionalDetalle
          loteId={52}
          usuarioId={1}
          vehiculos={[]}
          revisores={[]}
          accionVehiculoSolicitada
          onAccionVehiculoConsumida={vi.fn()}
          onCerrar={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect((await screen.findByRole("alert")).textContent).toContain("El lote ya está en ejecución.");
    expect(screen.getByRole("link", { name: "Abrir mapa" }).getAttribute("href")).toBe("/app/mapa?loteId=52");
    expect(screen.queryByRole("heading", { name: "Cambiar vehículo del lote" })).toBeNull();
    expect(cambiarVehiculo).not.toHaveBeenCalled();
  });
});
