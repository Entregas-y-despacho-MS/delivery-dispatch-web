import assert from "node:assert/strict";
import { after, test } from "node:test";
import axios, { AxiosError, CanceledError } from "axios";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

process.env.VITE_API_URL = "http://localhost/api";
let handleRequest = () => { throw new Error("No hay petición configurada"); };
axios.defaults.adapter = (config) => handleRequest(config);

const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(async () => server.close());

const stored = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => { stored.set(key, value); },
  removeItem: (key) => { stored.delete(key); },
} };
const { useAuthStore } = await server.ssrLoadModule("/src/shared/store/use-auth-store.ts");
delete globalThis.window;
const { default: api } = await server.ssrLoadModule("/src/shared/lib/axios.ts");
const { closeSession } = await server.ssrLoadModule("/src/shared/lib/session-lifecycle.ts");
const { queryClient } = await server.ssrLoadModule("/src/shared/lib/query-client.ts");
const { usuariosService } = await server.ssrLoadModule("/src/domains/usuarios/services/usuarios.service.ts");

const user = { id: "1", nombres: "Ana", apellidos: "Torres", rol: { id: 1, nombre: "Admin" } };

function unauthorized(config) {
  const response = { config, data: { error: "INVALID_TOKEN" }, headers: {}, status: 401, statusText: "Unauthorized" };
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, response);
}

test("logout limpia la caché y descarta un refresh que llega tarde", async () => {
  useAuthStore.getState().setLogin(user, "old-access", "old-refresh");
  queryClient.setQueryData(["private"], { secret: true });

  let startRefresh;
  const refreshStarted = new Promise((resolve) => { startRefresh = resolve; });
  let finishRefresh;
  let protectedCalls = 0;

  handleRequest = async (config) => {
    if (config.url === "/protected") {
      protectedCalls += 1;
      throw unauthorized(config);
    }
    if (config.url === "/auth/refresh") {
      startRefresh();
      return new Promise((resolve) => { finishRefresh = () => resolve({
        config, data: { accessToken: "late-access", refreshToken: "late-refresh" },
        headers: {}, status: 200, statusText: "OK",
      }); });
    }
    throw new Error(`Petición inesperada: ${config.url}`);
  };

  const pending = api.get("/protected").catch((error) => error);
  await refreshStarted;
  assert.equal(closeSession(), true);
  assert.equal(queryClient.getQueryData(["private"]), undefined);
  finishRefresh();
  await pending;

  assert.equal(useAuthStore.getState().access_token, null);
  assert.equal(useAuthStore.getState().refresh_token, null);
  assert.equal(JSON.parse(stored.get("delivery-dispatch-web-auth")).state.refresh_token, null);
  assert.equal(protectedCalls, 1);
});

test("cerrar sesión cancela una consulta HTTP pendiente", async () => {
  useAuthStore.getState().setLogin(user, "access", "refresh");
  let requestStarted;
  const started = new Promise((resolve) => { requestStarted = resolve; });
  let wasAborted = false;

  handleRequest = (config) => new Promise((_resolve, reject) => {
    assert.equal(config.url, "/users");
    assert.ok(config.signal);
    config.signal.addEventListener("abort", () => {
      wasAborted = true;
      reject(new CanceledError("cancelled", config));
    }, { once: true });
    requestStarted();
  });

  const pending = queryClient.fetchQuery({
    queryKey: ["pending-users"],
    queryFn: ({ signal }) => usuariosService.list(undefined, signal),
  }).catch((error) => error);
  await started;
  closeSession();
  await pending;

  assert.equal(wasAborted, true);
  assert.equal(queryClient.getQueryData(["pending-users"]), undefined);
});

test("un refresh de la sesión anterior no reemplaza una nueva sesión", async () => {
  useAuthStore.getState().setLogin(user, "first-access", "first-refresh");
  let startRefresh;
  const refreshStarted = new Promise((resolve) => { startRefresh = resolve; });
  let finishRefresh;

  handleRequest = async (config) => {
    if (config.url === "/protected") throw unauthorized(config);
    if (config.url === "/auth/refresh") {
      startRefresh();
      return new Promise((resolve) => { finishRefresh = () => resolve({
        config, data: { accessToken: "obsolete-access", refreshToken: "obsolete-refresh" },
        headers: {}, status: 200, statusText: "OK",
      }); });
    }
    throw new Error(`Petición inesperada: ${config.url}`);
  };

  const pending = api.get("/protected").catch((error) => error);
  await refreshStarted;
  closeSession();
  useAuthStore.getState().setLogin(user, "second-access", "second-refresh");
  finishRefresh();
  await pending;

  assert.equal(useAuthStore.getState().access_token, "second-access");
  assert.equal(useAuthStore.getState().refresh_token, "second-refresh");
  assert.equal(JSON.parse(stored.get("delivery-dispatch-web-auth")).state.refresh_token, "second-refresh");
  closeSession();
});

test("logout conserva el token capturado antes de limpiar la sesión", async () => {
  useAuthStore.getState().setLogin(user, "logout-access", "logout-refresh");
  closeSession();

  handleRequest = async (config) => {
    assert.equal(config.url, "/auth/logout");
    assert.equal(config.headers.Authorization, "Bearer logout-access");
    return { config, data: undefined, headers: {}, status: 204, statusText: "No Content" };
  };

  await api.post("/auth/logout", undefined, { headers: { Authorization: "Bearer logout-access" } });
});
