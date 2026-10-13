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

const { leerFiltrosBandeja, escribirFiltrosBandeja, FILTROS_BANDEJA_INICIALES } = await server.ssrLoadModule("/src/domains/despachos/despachos.url.ts");
const { describirVencimientoSla } = await server.ssrLoadModule("/src/domains/despachos/despachos.format.ts");
const { PrioridadBadge } = await server.ssrLoadModule("/src/domains/despachos/components/pedido-badges.tsx");
const { BandejaPedidosToolbar } = await server.ssrLoadModule("/src/domains/despachos/components/bandeja-pedidos-toolbar.tsx");
const { BandejaPedidosTable } = await server.ssrLoadModule("/src/domains/despachos/components/bandeja-pedidos-table.tsx");

const leer = (query) => leerFiltrosBandeja(new URLSearchParams(query));

test("los filtros combinados se leen de la URL tal cual", () => {
  assert.deepEqual(leer("buscar=ana&zona=3&turno=afternoon&prioridad=urgent&orden=weight&dir=desc&pagina=2"), {
    search: "ana", zona: "3", turno: "afternoon", prioridad: "urgent",
    orden: { sortBy: "weight", order: "desc" }, page: 2,
  });
});

test("un link con valores inválidos abre la bandeja sin filtros en vez de mandar basura al back", () => {
  assert.deepEqual(leer("prioridad=xyz&zona=-4&turno=noche&orden=hack&pagina=0"), FILTROS_BANDEJA_INICIALES);
});

test("la URL guarda solo lo elegido y respeta los parámetros ajenos a la bandeja", () => {
  assert.equal(escribirFiltrosBandeja(FILTROS_BANDEJA_INICIALES).toString(), "");
  const params = escribirFiltrosBandeja(
    { ...FILTROS_BANDEJA_INICIALES, prioridad: "urgent", turno: "morning", orden: { sortBy: "zone", order: "asc" }, page: 3 },
    new URLSearchParams("otro=1&zona=9"),
  );
  assert.equal(params.get("otro"), "1");
  assert.equal(params.get("zona"), null);
  assert.equal(params.toString(), "otro=1&turno=morning&prioridad=urgent&orden=zone&pagina=3");
  // Ida y vuelta: lo escrito se vuelve a leer igual.
  assert.deepEqual(leerFiltrosBandeja(params), { ...FILTROS_BANDEJA_INICIALES, prioridad: "urgent", turno: "morning", orden: { sortBy: "zone", order: "asc" }, page: 3 });
});

test("el badge de prioridad distingue urgente y normal", () => {
  const urgente = renderToStaticMarkup(createElement(PrioridadBadge, { priority: "urgent" }));
  const normal = renderToStaticMarkup(createElement(PrioridadBadge, { priority: "normal" }));
  assert.match(urgente, /Urgente/);
  assert.match(urgente, /text-destructive/);
  assert.match(normal, /Normal/);
  assert.doesNotMatch(normal, /text-destructive/);
});

test("el vencimiento del SLA se describe según cuánto falta", () => {
  const ahora = Date.parse("2026-10-12T14:00:00Z");
  assert.deepEqual(describirVencimientoSla(null, ahora), { estado: "sin-sla", texto: "Sin SLA", fecha: null });
  assert.equal(describirVencimientoSla("2026-10-12T12:00:00Z", ahora).texto, "Vencido hace 2 h");
  assert.equal(describirVencimientoSla("2026-10-12T14:45:00Z", ahora).estado, "proximo");
  assert.equal(describirVencimientoSla("2026-10-12T16:00:00Z", ahora).estado, "proximo");
  const lejos = describirVencimientoSla("2026-10-13T17:00:00Z", ahora);
  assert.equal(lejos.estado, "a-tiempo");
  assert.equal(lejos.texto, "Vence en 1 d 3 h");
  // Hora de Bolivia (UTC-4).
  assert.equal(lejos.fecha, "13/10, 13:00");
});

test("la barra muestra el filtro de prioridad y el interruptor «Solo urgentes» según el estado", () => {
  const render = (props) => renderToStaticMarkup(createElement(BandejaPedidosToolbar, {
    search: "", onSearchChange: () => {}, zonas: [], zona: "all", onZonaChange: () => {},
    turno: "all", onTurnoChange: () => {}, prioridad: "all", onPrioridadChange: () => {},
    soloUrgentes: false, onSoloUrgentesChange: () => {}, onRefrescar: () => {}, ...props,
  }));
  const apagado = render();
  assert.match(apagado, /aria-label="Filtrar por prioridad"/);
  assert.match(apagado, /Solo urgentes/);
  assert.match(apagado, /role="switch"[^>]*aria-checked="false"/);
  assert.match(render({ prioridad: "urgent", soloUrgentes: true }), /role="switch"[^>]*aria-checked="true"/);
});

test("la tabla muestra el SLA debajo de la prioridad de cada pedido", () => {
  const pedido = {
    id: 1, orderNumber: "SO-1", trackingCode: null, recipient: "Ana", recipientPhone: null, address: "Av. Arce",
    zoneId: 1, zoneName: "Sur", shift: "morning", windowStart: null, windowEnd: null, priority: "urgent",
    status: "pending", inbox: null, packagesCount: 1, weightKg: 1, volumeM3: 0.01, locked: false, reservation: null,
  };
  const html = renderToStaticMarkup(createElement(BandejaPedidosTable, {
    data: [
      { ...pedido, slaDueAt: new Date(Date.now() - 3 * 3_600_000).toISOString() },
      { ...pedido, id: 2, orderNumber: "SO-2", priority: "normal", slaDueAt: null },
    ],
    orden: null, onToggleOrden: () => {}, seleccion: {}, onSeleccionChange: () => {},
  }));
  assert.match(html, /Vencido hace 3 h/);
  assert.match(html, /Sin SLA/);
  assert.doesNotMatch(html, />Vence</, "el SLA no es una columna aparte");
});
