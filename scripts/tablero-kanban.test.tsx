// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { ColumnaKanban, DespachoKanban } from "@/domains/despachos";
// oxlint-disable-next-line no-restricted-imports -- tests must inspect this component's public behavior directly.
import { COLUMNAS_INVERSA, COLUMNAS_OPERATIVAS, destinoAbreRevision, ordenarColumnas, puedeArrastrarDespacho } from "@/domains/despachos/tablero-kanban.rules";

vi.mock("@/domains/catalogos", () => ({
  useZonas: () => ({ data: [{ id: 8, name: "Centro" }] }),
}));

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
// oxlint-disable-next-line no-restricted-imports -- tests must inspect this component's public behavior directly.
const { TableroKanban } = await import("@/domains/despachos/components/tablero-kanban");
afterEach(cleanup);
beforeAll(() => {
  Element.prototype.scrollIntoView = () => undefined;
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
});

function despacho(overrides: Partial<DespachoKanban> = {}): DespachoKanban {
  return {
    id: 41,
    sourceOrderRef: "ORD-0041",
    trackingCode: "TRK-0041",
    status: "pending",
    dispatchType: { id: 2, name: "Entrega" },
    zone: { id: 8, name: "Centro" },
    driver: { id: 12, fullName: "Ana Rojas" },
    vehicle: { id: 19, plate: "ABC-123" },
    windowStart: "2026-10-19T12:00:00.000Z",
    windowEnd: "2026-10-19T14:00:00.000Z",
    priority: "urgent",
    volumeM3: 1.25,
    attemptCount: 1,
    attemptLimit: 3,
    routeBatch: { id: 77, status: "provisional" },
    inbox: "proposed",
    reservation: null,
    ...overrides,
  };
}

function columna(key: ColumnaKanban["key"], overrides: Partial<ColumnaKanban> = {}): ColumnaKanban {
  return {
    key,
    statuses: [key],
    label: key,
    ordersCount: 0,
    volumeM3: 0,
    dispatches: [],
    ...overrides,
  };
}

const vacias = COLUMNAS_OPERATIVAS.map(({ key, label }) => columna(key, { label }));

function renderTablero(columns: ColumnaKanban[] = vacias, inverse = false) {
  const onDeliveryZoneChange = vi.fn();
  const onDriverChange = vi.fn();
  const onDispatchTypeChange = vi.fn();
  const onLogisticaInversaChange = vi.fn();
  const rendered = render(
    <TableroKanban
      date="2026-10-19"
      onDateChange={vi.fn()}
      deliveryZoneId="all"
      onDeliveryZoneChange={onDeliveryZoneChange}
      driverId="all"
      onDriverChange={onDriverChange}
      dispatchTypeId="all"
      onDispatchTypeChange={onDispatchTypeChange}
      logisticaInversa={inverse}
      onLogisticaInversaChange={onLogisticaInversaChange}
      columns={columns}
      isLoading={false}
      isError={false}
      isFetching={false}
      socketConnected
      onRetry={vi.fn()}
      onOpenReview={vi.fn()}
    />,
  );
  return { ...rendered, onDeliveryZoneChange, onDriverChange, onDispatchTypeChange, onLogisticaInversaChange };
}

describe("TableroKanban", () => {
  it("muestra las nueve columnas con contadores y volumen de servidor", () => {
    const columns = [
      ...vacias.filter(({ key }) => key !== "pending"),
      columna("pending", { label: "Pendiente", ordersCount: 3, volumeM3: 1.25, dispatches: [despacho()] }),
    ];
    const { container } = renderTablero(columns);

    expect(container.querySelectorAll("[data-column-key]")).toHaveLength(9);
    const pendiente = screen.getByRole("region", { name: "Pendiente" });
    expect(within(pendiente).getByText("3")).toBeTruthy();
    expect(within(pendiente).getByText(/3 órdenes/)).toBeTruthy();
    expect(within(pendiente).getByText("ORD-0041")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Cancelado" })).toBeNull();
  });

  it("cambia a las cuatro columnas de logística inversa", () => {
    const { container } = renderTablero([], true);

    expect(container.querySelectorAll("[data-column-key]")).toHaveLength(4);
    for (const { label } of COLUMNAS_INVERSA) expect(screen.getByRole("region", { name: label })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Pendiente" })).toBeNull();
  });

  it("envía los filtros de zona, conductor, tipo de despacho y el conmutador inverso", async () => {
    const user = userEvent.setup();
    const { onDeliveryZoneChange, onDriverChange, onDispatchTypeChange, onLogisticaInversaChange } = renderTablero([
      columna("pending", { dispatches: [despacho()] }),
    ]);

    await user.click(screen.getByRole("combobox", { name: "Zona logística" }));
    await user.click(screen.getByRole("option", { name: "Centro" }));
    await user.click(screen.getByRole("combobox", { name: "Conductor" }));
    await user.click(screen.getByRole("option", { name: "Ana Rojas" }));
    await user.click(screen.getByRole("combobox", { name: "Tipo de despacho" }));
    await user.click(screen.getByRole("option", { name: "Entrega" }));
    await user.click(screen.getByRole("switch", { name: "Logística inversa" }));

    expect(onDeliveryZoneChange).toHaveBeenLastCalledWith("8");
    expect(onDriverChange).toHaveBeenLastCalledWith("12");
    expect(onDispatchTypeChange).toHaveBeenLastCalledWith("2");
    expect(onLogisticaInversaChange).toHaveBeenLastCalledWith(true);
  });

  it("permite arrastrar solo pedidos de planificación con lote y solo acepta Programado o Asignado", () => {
    const itemArrastrable = despacho();
    const sinLote = despacho({ id: 42, sourceOrderRef: "ORD-0042", routeBatch: null });
    const enRuta = despacho({ id: 43, sourceOrderRef: "ORD-0043", status: "in_transit" });
    renderTablero([columna("pending", {
      label: "Pendiente",
      ordersCount: 3,
      volumeM3: 2,
      dispatches: [itemArrastrable, sinLote, enRuta],
    })]);

    expect(screen.getByRole("button", { name: "ORD-0041, Entrega" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "ORD-0042, Entrega" })).toBeNull();
    expect(screen.queryByRole("button", { name: "ORD-0043, Entrega" })).toBeNull();
    expect(puedeArrastrarDespacho("in_planning", 77)).toBe(true);
    expect(puedeArrastrarDespacho("delivered", 77)).toBe(false);
    expect(puedeArrastrarDespacho("pending", null)).toBe(false);
    expect(destinoAbreRevision("scheduled")).toBe(true);
    expect(destinoAbreRevision("assigned")).toBe(true);
    expect(destinoAbreRevision("in_transit")).toBe(false);
  });

  it("mantiene el orden operativo y agrega las columnas faltantes al cambiar modo", () => {
    const columns = ordenarColumnas([columna("returned", { ordersCount: 2, volumeM3: 0.5 })], true);
    expect(columns.map(({ key }) => key)).toEqual(COLUMNAS_INVERSA.map(({ key }) => key));
    expect(columns[3].ordersCount).toBe(2);
    expect(columns.slice(0, 3).every(({ ordersCount }) => ordersCount === 0)).toBe(true);
  });
});
