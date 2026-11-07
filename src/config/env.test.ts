import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("configuración de endpoints", () => {
  it("usa VITE_SOCKET_URL cuando se proporciona", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com/api");
    vi.stubEnv("VITE_SOCKET_URL", "https://socket.example.com");

    const { env } = await import("./env");

    expect(env.VITE_API_URL).toBe("https://api.example.com/api");
    expect(env.VITE_SOCKET_URL).toBe("https://socket.example.com");
  });

  it("deriva el origen de Socket.IO desde la API si no se configura", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com/api");
    vi.stubEnv("VITE_SOCKET_URL", undefined);

    const { env } = await import("./env");

    expect(env.VITE_SOCKET_URL).toBe("https://api.example.com");
  });
});
