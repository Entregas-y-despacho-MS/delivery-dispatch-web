import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(async () => server.close());

const { BandejaPedidosTable } = await server.ssrLoadModule("/src/domains/despachos/components/bandeja-pedidos-table.tsx");
const { BandejaPedidosVista } = await server.ssrLoadModule("/src/domains/despachos/components/bandeja-pedidos-vista.tsx");
const { formatearFranja } = await server.ssrLoadModule("/src/domains/despachos/despachos.format.ts");

const base = {
  trackingCode: null, recipient: "María Pérez", recipientPhone: null, address: "Av. Arce 2000",
  zoneId: 3, zoneName: "Zona Sur", shift: "morning", windowStart: "2026-10-12T12:00:00Z", windowEnd: "2026-10-12T14:00:00Z",
  priority: "normal", status: "pending", inbox: null, slaDueAt: null, packagesCount: 1, weightKg: 5, volumeM3: 0.02,
  locked: false, reservation: null,
};
const libre = { ...base, id: 1, orderNumber: "SO-LIBRE", priority: "urgent" };
const reservado = {
  ...base, id: 2, orderNumber: "SO-RESERVADO", inbox: "reserved", locked: true,
  reservation: { reservedById: 7, reservedByName: "Ana Rojas", expiresAt: "2026-10-12T15:00:00Z", reservedByMe: false },
};
const propuesto = { ...base, id: 3, orderNumber: "SO-PROPUESTO", status: "in_planning", inbox: "proposed" };
const enRevision = { ...base, id: 4, orderNumber: "SO-REVISION", status: "address_review", readOnly: true };

const renderTabla = (props = {}) => renderToStaticMarkup(createElement(BandejaPedidosTable, {
  data: [libre, reservado, propuesto],
  orden: null,
  onToggleOrden: () => {},
  seleccion: {},
  onSeleccionChange: () => {},
  ...props,
}));

const filas = (html) => html.split("<tbody")[1].split("<tr").slice(1);

test("la tabla respeta el orden que entrega el servidor y lo marca en el encabezado", () => {
  const html = renderTabla({
    data: [propuesto, libre, reservado],
    orden: { sortBy: "weight", order: "desc" },
  });
  const orden = filas(html).map((fila) => fila.match(/SO-[A-Z]+/)[0]);
  assert.deepEqual(orden, ["SO-PROPUESTO", "SO-LIBRE", "SO-RESERVADO"]);
  assert.equal((html.match(/aria-sort="descending"/g) ?? []).length, 1);
  assert.match(html, /aria-sort="descending"[^>]*>.*?Peso \(kg\)/s);
});

test("el pedido reservado por otro coordinador queda bloqueado para selección", () => {
  const [filaLibre, filaReservada] = filas(renderTabla());
  assert.doesNotMatch(filaLibre, /aria-disabled="true"/);
  assert.match(filaReservada, /aria-disabled="true"/);
  assert.match(filaReservada, /role="checkbox"[^>]*disabled=""/);
  assert.match(filaReservada, /En planificación por <!-- -->Ana Rojas|En planificación por Ana Rojas/);
});

test("seleccionar los disponibles ignora las filas bloqueadas", () => {
  const html = renderTabla({ data: [libre, reservado], seleccion: { 1: true } });
  const encabezado = html.split("<tbody")[0];
  assert.match(encabezado, /data-state="checked"/);
  const [filaLibre, filaReservada] = filas(html);
  assert.match(filaLibre, /data-state="checked"/);
  assert.doesNotMatch(filaReservada, /data-state="checked"/);
});

test("el pedido en revisión de dirección se muestra con su badge pero no se puede seleccionar", () => {
  const html = renderTabla({ data: [libre, enRevision], seleccion: { 1: true } });
  const [filaLibre, filaRevision] = filas(html);
  assert.match(filaRevision, /Dirección en revisión/);
  assert.match(filaRevision, /aria-disabled="true"/);
  assert.match(filaRevision, /role="checkbox"[^>]*disabled=""/);
  assert.match(filaRevision, /tiene la dirección en revisión/);
  assert.doesNotMatch(filaLibre, /aria-disabled="true"/);
  // Con el único pedido seleccionable marcado, "seleccionar todos" queda completo: ignora el de solo lectura.
  assert.match(html.split("<tbody")[0], /data-state="checked"/);
});

test("los badges distinguen propuesto, urgente y normal", () => {
  const [filaLibre, , filaPropuesta] = filas(renderTabla());
  assert.match(filaLibre, /Urgente/);
  assert.match(filaPropuesta, /Propuesto/);
  assert.match(filaPropuesta, /Normal/);
});

const renderVista = (props) => renderToStaticMarkup(createElement(BandejaPedidosVista, {
  data: [], orden: null, onToggleOrden: () => {}, seleccion: {}, onSeleccionChange: () => {},
  loading: false, onReintentar: () => {}, filtrada: false, onLimpiarFiltros: () => {},
  ...props,
}));

test("la bandeja vacía ofrece refrescar y distingue una búsqueda sin resultados", () => {
  const vacia = renderVista({});
  assert.match(vacia, /No hay pedidos pendientes de planificación/);
  assert.match(vacia, /Actualizar bandeja/);

  const filtrada = renderVista({ filtrada: true });
  assert.match(filtrada, /Ningún pedido coincide/);
  assert.match(filtrada, /Actualizar bandeja/);
  assert.doesNotMatch(filtrada, /No hay pedidos pendientes/);
});

test("mientras carga se ve el skeleton y no la tabla ni el vacío", () => {
  const html = renderVista({ loading: true, data: [libre] });
  assert.doesNotMatch(html, /SO-LIBRE|No hay pedidos/);
  assert.match(html, /N° de orden/);
});

test("la franja se muestra en hora de Bolivia", () => {
  assert.equal(formatearFranja("2026-10-12T12:00:00Z", "2026-10-12T14:00:00Z"), "08:00–10:00");
  assert.equal(formatearFranja(null, null), "Sin franja");
});

test("cada N° de orden enlaza a la ficha 360° del despacho (ST-241.4)", () => {
  const hrefFicha = (id) => `/app/despachos/${id}`;
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(BandejaPedidosTable, {
    data: [libre, reservado, enRevision],
    orden: null,
    onToggleOrden: () => {},
    seleccion: {},
    onSeleccionChange: () => {},
    hrefFicha,
  })));
  const enlaces = filas(html).map((fila) => fila.match(/<a[^>]*href="([^"]+)"[^>]*>(SO-[A-Z]+)<\/a>/)?.slice(1));
  // También los bloqueados y los de solo lectura: ver la ficha no necesita reservar el pedido.
  assert.deepEqual(enlaces, [["/app/despachos/1", "SO-LIBRE"], ["/app/despachos/2", "SO-RESERVADO"], ["/app/despachos/4", "SO-REVISION"]]);
  assert.match(html, /aria-label="Ver ficha del pedido SO-LIBRE"/);
});

test("sin hrefFicha el N° de orden queda como texto", () => {
  assert.doesNotMatch(renderTabla(), /<a /);
});
