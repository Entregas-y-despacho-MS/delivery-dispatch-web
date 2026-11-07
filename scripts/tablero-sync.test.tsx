// @vitest-environment jsdom
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { socketHandlers, socketOn, socketOff, socketDisconnect, socketIo } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const on = vi.fn((event: string, handler: (...args: unknown[]) => void) => { handlers.set(event, handler); });
  const off = vi.fn((event: string) => { handlers.delete(event); });
  const disconnect = vi.fn();
  const io = vi.fn((_url: string, _options: Record<string, unknown>) => ({ on, off, disconnect }));
  return { socketHandlers: handlers, socketOn: on, socketOff: off, socketDisconnect: disconnect, socketIo: io };
});

vi.mock("socket.io-client", () => ({ io: socketIo }));
vi.mock("@/domains/despachos/services/tablero-kanban.service", () => ({
  obtenerTableroKanban: vi.fn(async (params: { date: string }) => ({ date: params.date, columns: [] })),
}));

vi.stubEnv("VITE_API_URL", "http://localhost:3001/api");
vi.stubEnv("VITE_SOCKET_URL", "http://localhost:3010");
const [{ QueryClient, QueryClientProvider }, { useAuthStore }, { useDispatchEvents, DISPATCH_LIVE_EVENTS }, { useTableroKanban }] = await Promise.all([
  import("@tanstack/react-query"),
  import("@/shared/store/use-auth-store"),
  // oxlint-disable-next-line no-restricted-imports -- hook behavior is the subject of this integration test.
  import("@/domains/despachos/hooks/use-dispatch-events"),
  // oxlint-disable-next-line no-restricted-imports -- query polling behavior is tested at the hook boundary.
  import("@/domains/despachos/hooks/use-tablero-kanban"),
]);
const { renderHook: renderHookInTest } = await import("@testing-library/react");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useAuthStore.setState({ user: null, access_token: null, refresh_token: null });
});

beforeEach(() => {
  socketHandlers.clear();
  socketOn.mockClear();
  socketOff.mockClear();
  socketDisconnect.mockClear();
  socketIo.mockClear();
});

function withQueryClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

describe("sincronización del tablero", () => {
  it("conecta al namespace app con el token de sesión, reconecta y refresca al recibir eventos", async () => {
    useAuthStore.setState({ access_token: "access-token" });
    const { client, wrapper } = withQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHookInTest(() => useDispatchEvents(), { wrapper });

    expect(socketIo).toHaveBeenCalledWith("http://localhost:3010/app", expect.objectContaining({ auth: { token: "access-token" } }));
    expect(socketIo.mock.calls[0]?.[1]).toMatchObject({ reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1_000, reconnectionDelayMax: 30_000 });
    expect(DISPATCH_LIVE_EVENTS).toHaveLength(5);
    expect(DISPATCH_LIVE_EVENTS).not.toContain("dispatch.location.updated");
    expect(DISPATCH_LIVE_EVENTS).not.toContain("integration.message_rejected");
    expect(DISPATCH_LIVE_EVENTS).not.toContain("integration.order_incomplete");
    socketHandlers.get("connect")?.();
    await waitFor(() => expect(result.current.connected).toBe(true));

    vi.useFakeTimers();
    socketHandlers.get("dispatch.status_changed")?.({ dispatchId: 41 });
    socketHandlers.get("route.assigned")?.({ routeBatchId: 7 });
    await vi.advanceTimersByTimeAsync(499);
    expect(invalidate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dispatches-kanban"] });
    expect(invalidate).toHaveBeenCalledTimes(1);
    socketHandlers.get("disconnect")?.("transport close");
    vi.useRealTimers();
    await waitFor(() => expect(result.current.connected).toBe(false));
  });

  it("habilita el refetch de 15 segundos solo cuando no hay conexión", async () => {
    const { client, wrapper } = withQueryClient();
    const params = { date: "2026-10-19" };
    const { rerender } = renderHookInTest(({ connected }) => useTableroKanban(params, connected), {
      initialProps: { connected: false },
      wrapper,
    });
    await waitFor(() => expect(client.getQueryCache().find({ queryKey: ["dispatches-kanban", params] })?.state.data).toEqual({ date: params.date, columns: [] }));
    expect(client.getQueryCache().find({ queryKey: ["dispatches-kanban", params] })?.options.refetchInterval).toBe(15_000);

    rerender({ connected: true });
    await waitFor(() => expect(client.getQueryCache().find({ queryKey: ["dispatches-kanban", params] })?.options.refetchInterval).toBe(false));
  });
});
