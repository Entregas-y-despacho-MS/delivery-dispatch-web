// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReasignarParadasDialog } from "./reasignar-paradas-dialog";

Element.prototype.scrollIntoView = () => undefined;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => undefined;
HTMLElement.prototype.releasePointerCapture = () => undefined;

const mocks = vi.hoisted(() => ({ submit: vi.fn(), refetch: vi.fn() }));
vi.mock("../hooks/use-lotes", () => ({ useLote: () => ({
  data: { id: 12, version: 4, dispatches: [{ dispatchId: 81, version: 2, status: "out_for_delivery", sourceOrderRef: "ORD-81", deliveryAddress: "Av. Central 10" }] },
  isLoading: false, isError: false, refetch: mocks.refetch,
}) }));
vi.mock("../hooks/use-reasignacion-paradas", () => ({
  useDestinosReasignacion: () => ({ data: [{ routeBatchId: 34, version: 7, driverId: 5, driverFullName: "Ana Ruiz", vehicleId: 9, vehiclePlate: "ABC-123", zoneId: 2, zoneName: "Centro", remainingWeightKg: 100, remainingVolumeM3: 1 }], isLoading: false, isError: false, refetch: mocks.refetch }),
  useReasignarParadas: () => ({ mutateAsync: mocks.submit, isPending: false }),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("ReasignarParadasDialog", () => {
  it("envía parada elegida, motivo y versiones de ambos lotes", async () => {
    const user = userEvent.setup();
    render(<ReasignarParadasDialog routeBatchId={12} onOpenChange={vi.fn()} motivos={[{ id: 1, code: "CAPACITY", name: "Capacidad", active: true }]} />);

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar ORD-81" }));
    await user.click(screen.getByRole("combobox", { name: "Repartidor y vehículo destino" }));
    await user.click(await screen.findByText(/Ana Ruiz · ABC-123/));
    await user.click(screen.getByRole("combobox", { name: "Motivo" }));
    await user.click(await screen.findByText("Capacidad"));
    await user.click(screen.getByRole("button", { name: "Reasignar 1 parada" }));

    expect(mocks.submit).toHaveBeenCalledWith({ id: 12, payload: {
      dispatchIds: [81], targetBatchId: 34, reasonCode: "CAPACITY", version: 4, targetVersion: 7,
    } });
  });

  it("no habilita el envío sin selección completa", () => {
    render(<ReasignarParadasDialog routeBatchId={12} onOpenChange={vi.fn()} motivos={[]} />);
    expect((screen.getByRole("button", { name: "Reasignar 0 paradas" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("bloquea el reenvío tras 409 hasta recargar los lotes", async () => {
    const user = userEvent.setup();
    mocks.submit.mockRejectedValueOnce({ response: { status: 409 } });
    render(<ReasignarParadasDialog routeBatchId={12} onOpenChange={vi.fn()} motivos={[{ id: 1, code: "CAPACITY", name: "Capacidad", active: true }]} />);
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar ORD-81" }));
    await user.click(screen.getByRole("combobox", { name: "Repartidor y vehículo destino" }));
    await user.click(await screen.findByText(/Ana Ruiz · ABC-123/));
    await user.click(screen.getByRole("combobox", { name: "Motivo" }));
    await user.click(await screen.findByText("Capacidad"));
    await user.click(screen.getByRole("button", { name: "Reasignar 1 parada" }));
    expect((await screen.findByRole("alert")).textContent).toContain("El lote cambió");
    expect((screen.getByRole("button", { name: "Reasignar 0 paradas" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Recargar" }));
    expect((screen.getByRole("button", { name: "Reasignar 0 paradas" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
