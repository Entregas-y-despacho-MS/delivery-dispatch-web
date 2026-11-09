// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DespachoDetalle, RecepcionAlmacen, Recojo } from "@/domains/despachos";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
const { DespachoFicha, RecojosTable, etiquetaResultadoRecepcion, formatearCantidad, nombreItemRecepcion } = await import("@/domains/despachos");
afterEach(cleanup);

/** Un recojo de devolución ya devuelto a almacén; la recepción se cambia en cada prueba. */
const despacho: DespachoDetalle = {
  id: 310, trackingCode: "DSP-2026-00310", sourceOrderRef: "RMA-310",
  type: { id: 4, name: "warehouse_return_pickup" }, status: { id: 9, name: "returned_to_warehouse" }, priority: "normal",
  serviceLevel: null, evidencePolicy: "hand_delivery_standard", paymentStatusLabel: null, rating: null,
  scheduledWindowStart: null, scheduledWindowEnd: null, createdAt: "2026-11-08T10:00:00Z",
  destination: {
    address: "Av. Arce 123", reference: null, latitude: -16.5, longitude: -68.13,
    contactName: "Lucía Mamani", contactPhone: "+59170000000", zone: { id: 3, name: "Zona Sur" },
  },
  packages: [], route: null, receiver: null, timeline: [], incidents: [], reschedules: [], evidences: [],
};

const RECIBIDO: RecepcionAlmacen = {
  result: "complete", receivedAt: "2026-11-09T15:00:00.000Z", notes: null,
  items: [
    { itemCode: "SKU-100", packageId: null, acceptedQuantity: 2, missingQuantity: 0, damagedQuantity: 0, detail: null },
    { itemCode: null, packageId: 10, acceptedQuantity: 1, missingQuantity: 0, damagedQuantity: 0, detail: null },
  ],
};
const CON_DIFERENCIAS: RecepcionAlmacen = {
  result: "with_differences", receivedAt: "2026-11-09T16:30:00.000Z", notes: "Una caja llegó golpeada",
  items: [
    { itemCode: "SKU-100", packageId: null, acceptedQuantity: 2.5, missingQuantity: 0, damagedQuantity: 0, detail: null },
    { itemCode: "SKU-200", packageId: null, acceptedQuantity: 1, missingQuantity: 1, damagedQuantity: 2, detail: "Caja aplastada de un lado" },
  ],
};
const RECHAZADO: RecepcionAlmacen = { result: "rejected", receivedAt: "2026-11-09T17:00:00.000Z", notes: "Mercadería equivocada", items: [] };

const ficha = (receipt: DespachoDetalle["receipt"]) =>
  render(<DespachoFicha despacho={{ ...despacho, receipt }} onRenovar={vi.fn()} renovando={false} />);

const filasItems = (seccion: HTMLElement) =>
  within(within(seccion).getByRole("table", { name: "Ítems recibidos" })).getAllByRole("row").slice(1)
    .map((fila) => within(fila).getAllByRole("cell").map((celda) => celda.textContent));

describe("recepción en almacén en la ficha (ST-240.5)", () => {
  it("Recibido: muestra el resultado, la fecha y los ítems por código o por bulto", () => {
    ficha(RECIBIDO);

    const seccion = screen.getByRole("region", { name: "Recepción en almacén" });
    expect(within(seccion).getByText("Recibido")).toBeTruthy();
    expect(seccion.querySelector("time")?.getAttribute("dateTime")).toBe("2026-11-09T15:00:00.000Z");
    expect(within(seccion).getByText("3 aceptados · 0 faltantes · 0 dañados")).toBeTruthy();
    expect(filasItems(seccion)).toEqual([
      ["SKU-100", "2", "0", "0", "—"],
      ["Bulto #10", "1", "0", "0", "—"],
    ]);
  });

  it("Con diferencias: muestra las notas, los faltantes y dañados y el detalle de la diferencia", () => {
    ficha(CON_DIFERENCIAS);

    const seccion = screen.getByRole("region", { name: "Recepción en almacén" });
    expect(within(seccion).getByText("Con diferencias")).toBeTruthy();
    expect(within(seccion).getByText("Una caja llegó golpeada")).toBeTruthy();
    expect(within(seccion).getByText("3,5 aceptados · 1 faltantes · 2 dañados")).toBeTruthy();
    expect(filasItems(seccion)).toEqual([
      ["SKU-100", "2,5", "0", "0", "—"],
      ["SKU-200", "1", "1", "2", "Caja aplastada de un lado"],
    ]);
  });

  it("Rechazado: muestra el resultado y avisa que el almacén no mandó ítems", () => {
    ficha(RECHAZADO);

    const seccion = screen.getByRole("region", { name: "Recepción en almacén" });
    expect(within(seccion).getByText("Rechazado")).toBeTruthy();
    expect(within(seccion).getByText("Mercadería equivocada")).toBeTruthy();
    expect(within(seccion).getByText("El almacén no envió el detalle de los ítems.")).toBeTruthy();
    expect(within(seccion).queryByRole("table")).toBeNull();
  });

  it("sin recepción no muestra la sección, ni con null ni cuando el back todavía no manda el campo", () => {
    ficha(null);
    expect(screen.queryByRole("region", { name: "Recepción en almacén" })).toBeNull();
    cleanup();

    ficha(undefined);
    expect(screen.queryByRole("region", { name: "Recepción en almacén" })).toBeNull();
    // El resto de la ficha sigue igual.
    expect(screen.getByRole("region", { name: "Opinión del cliente" })).toBeTruthy();
  });
});

describe("resultado de la recepción en Recojos (ST-240.5)", () => {
  const recojo = (id: number, receiptResult: Recojo["receiptResult"]): Recojo => ({
    id, trackingCode: `DSP-2026-0030${id}`, sourceOrderRef: `RMA-${id}`, origin: "rma", status: receiptResult ? "returned_to_warehouse" : "assigned",
    contactName: `Cliente ${id}`, contactPhone: null, contactEmail: null, address: "Av. Arce 123", reference: null,
    latitude: null, longitude: null, returnReason: null, packageContents: null, estimatedBoxes: null, preferredPickupDate: null,
    destinationWarehouse: null, createdAt: "2026-11-08T12:00:00.000Z", receiptResult,
  });

  it("pone el badge del resultado en cada recojo recibido y nada en los que no llegaron al almacén", () => {
    render(
      <MemoryRouter>
        <RecojosTable data={[recojo(1, "complete"), recojo(2, "with_differences"), recojo(3, "rejected"), recojo(4, null)]} />
      </MemoryRouter>,
    );

    // La tabla de escritorio: una fila por recojo (la primera es el encabezado).
    const filas = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    const estado = (fila: HTMLElement) => within(fila).getAllByRole("cell").at(-2)?.textContent;
    expect(filas.map(estado)).toEqual([
      "Devuelto al almacénRecibido",
      "Devuelto al almacénCon diferencias",
      "Devuelto al almacénRechazado",
      "Asignado",
    ]);
  });
});

describe("reglas de la recepción (ST-240.5)", () => {
  it("nombra los ítems, formatea decimales y no rompe con un resultado desconocido", () => {
    expect(nombreItemRecepcion({ itemCode: "SKU-1", packageId: 4 })).toBe("SKU-1");
    expect(nombreItemRecepcion({ itemCode: null, packageId: 4 })).toBe("Bulto #4");
    expect(nombreItemRecepcion({ itemCode: null, packageId: null })).toBe("Ítem sin identificar");
    expect(formatearCantidad(1.256)).toBe("1,26");
    expect(etiquetaResultadoRecepcion("orphan")).toBe("orphan");
  });
});
