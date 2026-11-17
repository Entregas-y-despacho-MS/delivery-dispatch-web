import assert from "node:assert/strict";
import { after, test } from "node:test";
import axios, { AxiosError, CanceledError } from "axios";
import { toast } from "sonner";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

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

// Zustand necesita storage al importarse; el resto se carga como SSR para no abrir timers del navegador.
const stored = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => { stored.set(key, value); },
  removeItem: (key) => { stored.delete(key); },
} };
await server.ssrLoadModule("/src/shared/store/use-auth-store.ts");
delete globalThis.window;

const { parseApiError } = await server.ssrLoadModule("/src/shared/lib/api-error.ts");
const { describeLoginError } = await server.ssrLoadModule("/src/domains/auth/auth.errors.ts");
const { describeUsuarioError } = await server.ssrLoadModule("/src/domains/usuarios/usuarios.errors.ts");
const { queryClient } = await server.ssrLoadModule("/src/shared/lib/query-client.ts");
const { default: api } = await server.ssrLoadModule("/src/shared/lib/axios.ts");
const { authService } = await server.ssrLoadModule("/src/domains/auth/services/auth.service.ts");
const { zonasService } = await server.ssrLoadModule("/src/domains/catalogos/services/zonas.service.ts");
const { ErrorBoundary } = await server.ssrLoadModule("/src/shared/components/feedback/error-boundary.tsx");
const { PageErrorBoundary } = await server.ssrLoadModule("/src/shared/components/feedback/page-error-boundary.tsx");

function httpError(status, code, message, config = { method: "get", url: "/test" }) {
  const response = { config, data: { statusCode: status, error: code, message }, headers: {}, status, statusText: "Error" };
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, {}, response);
}

test("normaliza listas de validación y conserva el código de negocio", () => {
  const parsed = parseApiError(httpError(400, "Bad Request", ["Name is required", "Role ID must be an integer"]));
  assert.equal(parsed.kind, "validation");
  assert.equal(parsed.status, 400);
  assert.equal(parsed.code, "Bad Request");
  assert.deepEqual(parsed.validationMessages, ["Name is required", "Role ID must be an integer"]);
  assert.match(parsed.message, /Name is required/);
  assert.equal(parsed.retryable, false);
  assert.equal(parseApiError(new Error("detalle interno sensible")).message.includes("detalle interno sensible"), false);

  assert.equal(describeLoginError(httpError(401, "ACCOUNT_LOCKED", "Account locked")).kind, "locked");
  assert.equal(describeUsuarioError(httpError(409, "USER_ALREADY_EXISTS", "Duplicate")).kind, "duplicado");
});

test("solo red y errores de servidor admiten reintento automático", () => {
  const retry = queryClient.getDefaultOptions().queries.retry;
  const network = new AxiosError("Network Error", "ERR_NETWORK", { url: "/test" }, {});
  assert.equal(parseApiError(network).kind, "network");
  assert.equal(retry(0, network), true);
  assert.equal(retry(1, httpError(503, "SERVICE_UNAVAILABLE", "Unavailable")), true);
  assert.equal(retry(2, network), false);
  for (const status of [400, 403, 429]) {
    assert.equal(retry(0, httpError(status, "ERROR", "Failure")), false);
  }
  assert.equal(retry(0, new CanceledError("cancelled")), false);
  assert.equal(parseApiError(httpError(500, "INTERNAL_SERVER_ERROR", "Secret stack trace")).message.includes("Secret stack trace"), false);
});

test("GET usa la alerta local y una acción sin manejo local usa un solo toast", async () => {
  handleRequest = async (config) => { throw httpError(503, "SERVICE_UNAVAILABLE", "Unavailable", config); };
  const before = toast.getHistory().length;

  await api.get("/test").catch(() => undefined);
  assert.equal(toast.getHistory().length, before);

  await api.post("/test", {}).catch(() => undefined);
  assert.equal(toast.getHistory().length, before + 1);

  await api.post("/test", {}, { skipErrorToast: true }).catch(() => undefined);
  assert.equal(toast.getHistory().length, before + 1);

  handleRequest = async (config) => { throw new CanceledError("cancelled", config); };
  await api.post("/test", {}).catch(() => undefined);
  assert.equal(toast.getHistory().length, before + 1);
});

test("formularios con error local no generan un toast adicional", async () => {
  handleRequest = async (config) => { throw httpError(400, "Bad Request", ["Invalid field"], config); };
  const before = toast.getHistory().length;

  await authService.resetPassword({ token: "invalid", newPassword: "Test12345!" }).catch(() => undefined);
  await zonasService.create({ code: "Z", name: "Zona", estimatedTimeMin: 10 }).catch(() => undefined);

  assert.equal(toast.getHistory().length, before);
});

test("el límite de pantalla oculta detalles internos del error", () => {
  const boundary = new ErrorBoundary({ scope: "page", children: null });
  boundary.state = { error: new Error("detalle interno sensible") };
  const html = renderToStaticMarkup(boundary.render());
  assert.match(html, /Esta pantalla tuvo un problema/);
  assert.doesNotMatch(html, /detalle interno sensible/);
});

test("el límite de ruta conserva el layout y renderiza su pantalla", () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/app/prueba"] },
    createElement(Routes, null,
      createElement(Route, { path: "/app", element: createElement("main", null, "Menú", createElement(PageErrorBoundary)) },
        createElement(Route, { path: "prueba", element: createElement("p", null, "Contenido") })),
    ),
  ));
  assert.match(html, /Menú/);
  assert.match(html, /Contenido/);
});
