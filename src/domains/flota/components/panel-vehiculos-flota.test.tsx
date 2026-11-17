// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelVehiculosFlota } from "./panel-vehiculos-flota";

afterEach(cleanup);

describe("PanelVehiculosFlota", () => {
  it("permite abrir la reasignación del lote desde la ficha del vehículo", async () => {
    const user = userEvent.setup();
    const onReasignar = vi.fn();
    render(<PanelVehiculosFlota
      posiciones={[{
        routeBatchId: 12, driverId: 5, driverFullName: "Ana Ruiz", vehicleId: 9, vehiclePlate: "ABC-123",
        deliveryZone: { id: 2, name: "Centro" }, currentStop: { dispatchId: 81, trackingCode: "ORD-81", status: "in_transit" },
        lastLatitude: -17.7, lastLongitude: -63.1, lastLocationAt: new Date().toISOString(),
      }]}
      zonaId="todas" onZonaChange={vi.fn()} estado="todos" onEstadoChange={vi.fn()}
      umbralMinutos={5} ahora={Date.now()} rutaSeleccionada={null} onSeleccionar={vi.fn()} onReasignar={onReasignar}
    />);
    await user.click(screen.getByRole("button", { name: "Reasignar paradas de ABC-123" }));
    expect(onReasignar).toHaveBeenCalledWith(12);
  });
});
