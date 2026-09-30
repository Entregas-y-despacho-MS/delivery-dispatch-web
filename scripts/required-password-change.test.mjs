import assert from "node:assert/strict";
import { after, test } from "node:test";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
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
const { needsPasswordChange, useAuthStore } = await server.ssrLoadModule("/src/shared/store/use-auth-store.ts");
delete globalThis.window;

const { authService } = await server.ssrLoadModule("/src/domains/auth/services/auth.service.ts");
const { changePasswordSchema } = await server.ssrLoadModule("/src/domains/auth/auth.schemas.ts");
const { describeChangePasswordError } = await server.ssrLoadModule("/src/domains/auth/auth.errors.ts");
const { default: api } = await server.ssrLoadModule("/src/shared/lib/axios.ts");
const { closeSession } = await server.ssrLoadModule("/src/shared/lib/session-lifecycle.ts");

const backendUser = {
  id: 7, fullName: "Ana Torres", username: "atorres", email: null,
  role: { id: 3, name: "coordinator" }, active: true,
  twoFactorEnabled: false, requiresPwdChange: false, createdAt: "2026-01-01T00:00:00Z",
};

function httpError(status, code, config) {
  const response = { config, data: { statusCode: status, error: code, message: code }, headers: {}, status, statusText: "Error" };
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, {}, response);
}

test("login respeta la señal superior aunque la bandera del usuario sea falsa", async () => {
  handleRequest = async (config) => {
    assert.equal(config.url, "/auth/login");
    return { config, data: {
      accessToken: "access", refreshToken: "refresh", user: backendUser,
      mustChangePassword: true,
    }, headers: {}, status: 200, statusText: "OK" };
  };

  const session = await authService.login({ username: "atorres", password: "OldPassw0rd!" });
  assert.equal(session.user.mustChangePassword, true);
  assert.equal(needsPasswordChange(session.user), true);
  useAuthStore.getState().setLogin(session.user, session.accessToken, session.refreshToken);
  assert.equal(needsPasswordChange(useAuthStore.getState().user), true);
  closeSession();
});

test("el backend puede exigir el cambio durante una sesión ya iniciada", async () => {
  useAuthStore.getState().setLogin({
    id: "7", nombres: "Ana", apellidos: "Torres", rol: { id: 1, nombre: "Coordinador" },
    mustChangePassword: false,
  }, "access", "refresh");
  handleRequest = async (config) => { throw httpError(403, "PASSWORD_CHANGE_REQUIRED", config); };
  const before = toast.getHistory().length;

  await assert.rejects(api.get("/users"));
  assert.equal(needsPasswordChange(useAuthStore.getState().user), true);
  assert.equal(toast.getHistory().length, before);
  closeSession();
});

test("la renovación del token conserva la obligación de cambiar la contraseña", async () => {
  useAuthStore.getState().setLogin({
    id: "7", nombres: "Ana", apellidos: "Torres", rol: { id: 1, nombre: "Coordinador" },
    mustChangePassword: false,
  }, "old-access", "old-refresh");
  let protectedCalls = 0;
  handleRequest = async (config) => {
    if (config.url === "/auth/refresh") {
      assert.deepEqual(JSON.parse(config.data), { refreshToken: "old-refresh" });
      return { config, data: {
        accessToken: "new-access", refreshToken: "new-refresh", mustChangePassword: true,
      }, headers: {}, status: 200, statusText: "OK" };
    }
    assert.equal(config.url, "/users");
    protectedCalls += 1;
    if (protectedCalls === 1) throw httpError(401, "INVALID_TOKEN", config);
    assert.equal(config.headers.Authorization, "Bearer new-access");
    throw httpError(403, "PASSWORD_CHANGE_REQUIRED", config);
  };

  await assert.rejects(api.get("/users"));
  assert.equal(protectedCalls, 2);
  assert.equal(useAuthStore.getState().refresh_token, "new-refresh");
  assert.equal(needsPasswordChange(useAuthStore.getState().user), true);
  closeSession();
});

test("cambio de contraseña envía solo los dos campos del contrato y deja el error inline", async () => {
  useAuthStore.getState().setLogin({
    id: "7", nombres: "Ana", apellidos: "Torres", rol: { id: 1, nombre: "Coordinador" },
    mustChangePassword: true,
  }, "access", "refresh");
  const before = toast.getHistory().length;
  handleRequest = async (config) => {
    assert.equal(config.url, "/auth/change-password");
    assert.equal(config.method, "patch");
    assert.equal(config.headers.Authorization, "Bearer access");
    assert.deepEqual(JSON.parse(config.data), { currentPassword: "OldPassw0rd!", newPassword: "NewPassw0rd!" });
    throw httpError(401, "INVALID_CREDENTIALS", config);
  };

  const error = await authService.changePassword({ currentPassword: "OldPassw0rd!", newPassword: "NewPassw0rd!" })
    .catch((failure) => failure);
  assert.deepEqual(describeChangePasswordError(error), {
    field: "currentPassword", message: "La contraseña actual no es correcta.",
  });
  assert.equal(toast.getHistory().length, before);
  assert.equal(useAuthStore.getState().access_token, "access");
  closeSession();
});

test("ambos flujos aplican la misma política de contraseña", () => {
  assert.equal(changePasswordSchema.safeParse({
    currentPassword: "OldPassw0rd!", newPassword: "weak", confirmPassword: "weak",
  }).success, false);
  assert.equal(changePasswordSchema.safeParse({
    currentPassword: "OldPassw0rd!", newPassword: "NewPassw0rd!", confirmPassword: "different",
  }).success, false);
  assert.equal(changePasswordSchema.safeParse({
    currentPassword: "OldPassw0rd!", newPassword: "NewPassw0rd!", confirmPassword: "NewPassw0rd!",
  }).success, true);
});
