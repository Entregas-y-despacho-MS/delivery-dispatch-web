// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SeguimientoPublico } from "@/domains/seguimiento";

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
// oxlint-disable-next-line no-restricted-imports -- se prueba la tarjeta aislada.
const { CalificarEntregaCard } = await import("@/domains/seguimiento/components/calificar-entrega-card");
afterEach(cleanup);

const pedido = { canRate: true, rating: null } as SeguimientoPublico;

describe("comentario de calificación (ST-43.2)", () => {
  it("muestra un campo opcional con contador y límite de 500 caracteres", async () => {
    const user = userEvent.setup();
    render(<CalificarEntregaCard pedido={pedido} onEnviar={vi.fn()} />);

    const comentario = screen.getByRole("textbox", { name: "Comentario (opcional)" });
    expect(comentario.getAttribute("maxLength")).toBe("500");
    expect(screen.getByText("0/500 caracteres")).toBeTruthy();
    await user.type(comentario, "Hola");
    expect(screen.getByText("4/500 caracteres")).toBeTruthy();
    await user.click(comentario);
    await user.paste("a".repeat(501));
    expect((comentario as HTMLTextAreaElement).value).toHaveLength(500);
    expect(screen.getByText("500/500 caracteres")).toBeTruthy();
  });

  it("envía el puntaje junto al comentario recortado", async () => {
    const user = userEvent.setup();
    const onEnviar = vi.fn();
    render(<CalificarEntregaCard pedido={pedido} onEnviar={onEnviar} />);

    await user.click(screen.getByRole("radio", { name: "5 estrellas" }));
    await user.type(screen.getByRole("textbox", { name: "Comentario (opcional)" }), "  Llegó rápido  ");
    await user.click(screen.getByRole("button", { name: "Enviar calificación" }));

    await waitFor(() => expect(onEnviar).toHaveBeenCalledWith({ score: 5, comment: "Llegó rápido" }));
  });

  it("muestra el comentario devuelto tras guardar la calificación", () => {
    render(<CalificarEntregaCard
      pedido={{ ...pedido, rating: { score: 4, comment: "Muy buena atención", createdAt: "2026-10-19T15:00:00Z" } }}
      onEnviar={vi.fn()}
    />);
    expect(screen.getByRole("region", { name: "Tu calificación" }).textContent).toContain("Tu comentario: Muy buena atención");
  });
});
