import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(async () => server.close());

const { QUERY_POLICIES } = await server.ssrLoadModule("/src/shared/lib/query-policies.ts");
const { queryClient } = await server.ssrLoadModule("/src/shared/lib/query-client.ts");
const { readStoredTheme, resolveTheme } = await server.ssrLoadModule("/src/shared/lib/theme.ts");
const { useCrud } = await server.ssrLoadModule("/src/shared/hooks/use-crud.ts");

test("las consultas operativas usan la política por defecto y ninguna política inicia sondeos", () => {
  const defaults = queryClient.getDefaultOptions().queries;
  assert.equal(defaults.staleTime, QUERY_POLICIES.operational.staleTime);
  assert.equal(defaults.gcTime, undefined);
  assert.ok(QUERY_POLICIES.catalog.staleTime > QUERY_POLICIES.operational.staleTime);
  assert.equal(QUERY_POLICIES.live.staleTime, 0);
  for (const policy of Object.values(QUERY_POLICIES)) {
    assert.equal("refetchInterval" in policy, false);
  }
});

test("useCrud aplica la política elegida a la consulta real", () => {
  const service = { list: async () => ({ items: [], total: 0 }) };
  function Probe({ policy }) {
    useCrud(service, "policy-probe", { policy });
    return null;
  }

  for (const policy of ["operational", "catalog", "live"]) {
    const client = new QueryClient();
    renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe, { policy })));
    const [query] = client.getQueryCache().getAll();
    assert.equal(query.options.staleTime, QUERY_POLICIES[policy].staleTime);
    assert.equal(query.options.gcTime, undefined);
    assert.equal(query.options.refetchInterval, undefined);
    client.clear();
  }
});

test("un tema guardado inválido vuelve al predeterminado", () => {
  assert.equal(readStoredTheme("valor-desconocido", "dark"), "dark");
  assert.equal(readStoredTheme(null, "light"), "light");
  assert.equal(readStoredTheme("system", "dark"), "system");
});

test("el tema del sistema resuelve ambos cambios de preferencia", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("light", true), "light");
});
