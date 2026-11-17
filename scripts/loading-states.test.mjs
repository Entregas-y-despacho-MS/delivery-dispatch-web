import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement, lazy } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(async () => server.close());

const { AsyncState } = await server.ssrLoadModule("/src/shared/components/feedback/async-state.tsx");
const { CardSkeletonList } = await server.ssrLoadModule("/src/shared/components/feedback/card-skeleton-list.tsx");
const { PageSkeleton } = await server.ssrLoadModule("/src/shared/components/feedback/page-skeleton.tsx");
const { PublicLayout } = await server.ssrLoadModule("/src/shared/components/layout/public-layout.tsx");
const { TrackingLayout } = await server.ssrLoadModule("/src/shared/components/layout/tracking-layout.tsx");
const { ThemeProvider } = await server.ssrLoadModule("/src/shared/lib/theme-provider.tsx");

function renderState(props) {
  return renderToStaticMarkup(createElement(AsyncState, {
    loading: false,
    empty: false,
    loadingFallback: createElement("p", null, "Cargando recurso"),
    emptyFallback: createElement("p", null, "Sin datos"),
    ...props,
  }, createElement("p", null, "Datos listos")));
}

test("el recurso muestra solo el estado prioritario", () => {
  const loading = renderState({ loading: true, error: new Error("fallo"), empty: true });
  assert.match(loading, /Cargando recurso/);
  assert.doesNotMatch(loading, /Sin datos|Datos listos|No se pudo completar/);

  const failed = renderState({ error: new Error("fallo"), empty: true });
  assert.match(failed, /No se pudo completar la operación/);
  assert.doesNotMatch(failed, /Sin datos|Datos listos/);

  assert.match(renderState({ empty: true }), /Sin datos/);
  assert.match(renderState(), /Datos listos/);
});

test("las tarjetas móviles y el fallback del panel conservan estados accesibles", () => {
  const cards = renderToStaticMarkup(createElement(CardSkeletonList, { count: 4 }));
  assert.equal((cards.match(/aria-hidden="true"/g) ?? []).length, 4);
  const page = renderToStaticMarkup(createElement(PageSkeleton));
  assert.match(page, /aria-label="Cargando página"/);
});

test("una página pública pendiente conserva el encabezado y el pie de su layout", () => {
  globalThis.localStorage = { getItem: () => null };
  const PendingPage = lazy(() => new Promise(() => {}));
  const html = renderToStaticMarkup(createElement(ThemeProvider, null,
    createElement(MemoryRouter, { initialEntries: ["/"] },
      createElement(Routes, null,
        createElement(Route, { element: createElement(PublicLayout) },
          createElement(Route, { path: "/", element: createElement(PendingPage) })),
      ),
    ),
  ));
  delete globalThis.localStorage;

  assert.match(html, /delivery-dispatch-web/);
  assert.match(html, /Iniciar sesión/);
  assert.match(html, /Cargando/);
  assert.match(html, /<footer/);
});

test("una página de seguimiento pendiente conserva la cabecera del portal", () => {
  globalThis.localStorage = { getItem: () => null };
  const PendingPage = lazy(() => new Promise(() => {}));
  const html = renderToStaticMarkup(createElement(ThemeProvider, null,
    createElement(MemoryRouter, { initialEntries: ["/seguimiento"] },
      createElement(Routes, null,
        createElement(Route, { element: createElement(TrackingLayout) },
          createElement(Route, { path: "/seguimiento", element: createElement(PendingPage) })),
      ),
    ),
  ));
  delete globalThis.localStorage;

  assert.match(html, /Seguimiento de pedido/);
  assert.match(html, /Cargando/);
  assert.match(html, /<footer/);
});
