import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(async () => server.close());

const { PaginationControls } = await server.ssrLoadModule("/src/shared/components/common/pagination-controls.tsx");
const { PagedTableControls } = await server.ssrLoadModule("/src/shared/components/common/paged-table-controls.tsx");
const { SearchField } = await server.ssrLoadModule("/src/shared/components/common/search-field.tsx");
const { ConfirmActionDialog } = await server.ssrLoadModule("/src/shared/components/common/confirm-action-dialog.tsx");
const { ResponsiveList } = await server.ssrLoadModule("/src/shared/components/common/responsive-list.tsx");

test("la paginación nunca solicita páginas fuera del rango", () => {
  const requested = [];
  const onPageChange = (page) => requested.push(page);
  const first = PaginationControls({ page: 1, totalPages: 3, onPageChange });
  const [previousFirst, nextFirst] = first.props.children[1].props.children;
  assert.equal(previousFirst.props.disabled, true);
  nextFirst.props.onClick();

  const last = PaginationControls({ page: 3, totalPages: 3, onPageChange });
  const [previousLast, nextLast] = last.props.children[1].props.children;
  assert.equal(nextLast.props.disabled, true);
  previousLast.props.onClick();

  assert.deepEqual(requested, [2, 2]);
});

test("la búsqueda conserva un nombre accesible y el valor controlado", () => {
  const html = renderToStaticMarkup(createElement(SearchField, {
    id: "zonas-search",
    label: "Buscar zonas",
    value: "Sur",
    onChange: () => {},
    placeholder: "ZON-SUR o Zona Sur",
  }));
  assert.match(html, /<label for="zonas-search"/);
  assert.match(html, /value="Sur"/);
  assert.match(html, /placeholder="ZON-SUR o Zona Sur"/);
});

test("la confirmación no se cierra mientras la acción sigue pendiente", () => {
  const changes = [];
  const props = {
    open: true,
    onOpenChange: (open) => changes.push(open),
    title: "Desactivar zona",
    description: "La zona dejará de estar disponible.",
    confirmLabel: "Desactivar zona",
    onConfirm: () => {},
  };
  ConfirmActionDialog({ ...props, busy: true }).props.onOpenChange(false);
  assert.deepEqual(changes, []);
  ConfirmActionDialog({ ...props, busy: false }).props.onOpenChange(false);
  assert.deepEqual(changes, [false]);
});

test("la lista adaptable conserva los estados de carga, filtro vacío y tarjetas", () => {
  const props = {
    columns: [{ header: "Nombre", cell: "name" }],
    data: [],
    emptyMessage: "Sin zonas coincidentes",
    isFiltered: true,
    mobileFilteredState: true,
    onClearFilters: () => {},
    renderCard: (item) => createElement("article", null, item.name),
  };
  const loading = renderToStaticMarkup(createElement(ResponsiveList, { ...props, loading: true, mobileSkeletonCount: 4 }));
  assert.equal((loading.match(/aria-hidden="true"/g) ?? []).length, 4);
  assert.doesNotMatch(loading, /Sin zonas coincidentes/);

  const empty = renderToStaticMarkup(createElement(ResponsiveList, props));
  assert.match(empty, /Sin zonas coincidentes/);
  assert.match(empty, /Limpiar filtros/);

  const populated = renderToStaticMarkup(createElement(ResponsiveList, {
    ...props,
    data: [{ id: 1, name: "Zona Norte" }],
  }));
  assert.match(populated, /<article>Zona Norte<\/article>/);
  assert.doesNotMatch(populated, /Sin zonas coincidentes/);
});

test("la paginación compacta muestra el rango real y los límites", () => {
  const html = renderToStaticMarkup(createElement(PagedTableControls, {
    page: 3,
    totalPages: 3,
    total: 23,
    pageSize: 10,
    onPageSizeChange: () => {},
    onPageChange: () => {},
    itemLabel: "usuarios",
  }));
  assert.match(html, /Mostrando/);
  assert.match(html, /21/);
  assert.match(html, /23/);
  assert.match(html, /Página siguiente/);
});
