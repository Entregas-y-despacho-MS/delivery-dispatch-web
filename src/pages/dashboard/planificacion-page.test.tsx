// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useVehiculosMock, useLotesMock, useUsuariosMock, useAuthStoreMock } = vi.hoisted(() => ({
  useVehiculosMock: vi.fn(),
  useLotesMock: vi.fn(),
  useUsuariosMock: vi.fn(),
  useAuthStoreMock: vi.fn(),
}));

vi.mock("@/domains/flota", () => ({ useVehiculos: useVehiculosMock }));
vi.mock("@/domains/usuarios", () => ({ useUsuarios: useUsuariosMock }));
vi.mock("@/shared/store/use-auth-store", () => ({ useAuthStore: useAuthStoreMock }));
vi.mock("@/domains/planificacion", async () => {
  const React = await import("react");
  return {
    useLotes: useLotesMock,
    LoteResumenCard: () => null,
    LoteProvisionalDetalle: ({ loteId, accionVehiculoSolicitada, onAccionVehiculoConsumida }: {
      loteId: number;
      accionVehiculoSolicitada: boolean;
      onAccionVehiculoConsumida: () => void;
    }) => React.createElement(
      "button",
      { type: "button", onClick: onAccionVehiculoConsumida, "data-testid": "lote-detail" },
      accionVehiculoSolicitada ? `Cambiar vehículo del lote ${loteId}` : `Detalle del lote ${loteId}`,
    ),
  };
});

import PlanificacionPage from "./planificacion-page";

function SearchActual() {
  return <output data-testid="search-actual">{useLocation().search}</output>;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PlanificacionPage — deep link de cambio de vehículo", () => {
  it("pasa el lote y la acción solicitada al detalle y consume el parámetro al cerrar", async () => {
    const user = userEvent.setup();
    useAuthStoreMock.mockImplementation((selector) => selector({ user: { id: 1 } }));
    useVehiculosMock.mockReturnValue({ data: [] });
    useLotesMock.mockReturnValue({ data: { items: [] }, isLoading: false, isError: false, refetch: vi.fn() });
    useUsuariosMock.mockReturnValue({ data: { items: [] } });

    render(
      <MemoryRouter initialEntries={["/app/planificacion?loteId=52&accion=cambiar-vehiculo"]}>
        <Routes><Route path="/app/planificacion" element={<PlanificacionPage />} /></Routes>
        <SearchActual />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("lote-detail").textContent).toBe("Cambiar vehículo del lote 52");
    await user.click(screen.getByTestId("lote-detail"));
    expect(screen.getByTestId("search-actual").textContent).toBe("?loteId=52");
  });
});
