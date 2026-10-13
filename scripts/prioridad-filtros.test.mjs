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
const { PrioridadSelector } = await server.ssrLoadModule("/src/domains/despachos/components/prioridad-selector.tsx");
const { opcionesCambioPrioridad, bandejaKeys } = await server.ssrLoadModule("/src/domains/despachos/despachos.prioridad.ts");
const { QueryClient, MutationObserver } = await server.ssrLoadModule("@tanstack/react-query");

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
  // Lejos del vencimiento se omiten los minutos para que el texto no ensanche la tabla.
  assert.equal(describirVencimientoSla("2026-10-11T16:12:00Z", ahora).texto, "Vencido hace 21 h");
  assert.equal(describirVencimientoSla("2026-10-12T15:10:00Z", ahora).texto, "Vence en 1 h 10 min");
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

// ── Cambio rápido de prioridad (ST-58.1 parte 2, contra PATCH /dispatches/:id/priority de ST-58.2) ──

const pedidoBandeja = (id, priority, status = "pending") => ({ id, orderNumber: `SO-${id}`, priority, status });

/** Bandeja en caché + la mutación real de la tabla, con el back y los toasts simulados. */
function prepararCambio(cambiar) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const key = bandejaKeys.lists({ page: 1 });
  queryClient.setQueryData(key, { items: [pedidoBandeja(1, "normal"), pedidoBandeja(2, "urgent")], total: 2 });
  const avisos = { exito: [], error: [] };
  const opciones = opcionesCambioPrioridad({
    queryClient,
    cambiar,
    avisar: { exito: (m) => avisos.exito.push(m), error: (m) => avisos.error.push(m) },
  });
  const mutacion = new MutationObserver(queryClient, opciones);
  const prioridadEnCache = (id) => queryClient.getQueryData(key).items.find((p) => p.id === id).priority;
  return { mutacion, avisos, prioridadEnCache };
}

test("cambiar la prioridad con éxito actualiza la bandeja y avisa con un toast", async () => {
  const llamadas = [];
  const { mutacion, avisos, prioridadEnCache } = prepararCambio(async (id, priority) => {
    llamadas.push({ id, priority });
    return { id, priority, status: "pending" };
  });
  await mutacion.mutate({ pedido: { id: 1, orderNumber: "SO-1" }, priority: "urgent" });
  assert.deepEqual(llamadas, [{ id: 1, priority: "urgent" }]);
  assert.equal(prioridadEnCache(1), "urgent");
  assert.equal(prioridadEnCache(2), "urgent", "los demás pedidos no cambian");
  assert.deepEqual(avisos.exito, ["SO-1 ahora es urgente."]);
  assert.deepEqual(avisos.error, []);
});

test("si el back rechaza el cambio (409) el badge vuelve a su prioridad y se explica por qué", async () => {
  const rechazo = {
    isAxiosError: true,
    response: { status: 409, data: { error: "DISPATCH_PRIORITY_NOT_CHANGEABLE", message: "current status: assigned" } },
  };
  const { mutacion, avisos, prioridadEnCache } = prepararCambio(async () => { throw rechazo; });
  await assert.rejects(mutacion.mutate({ pedido: { id: 1, orderNumber: "SO-1" }, priority: "urgent" }));
  assert.equal(prioridadEnCache(1), "normal");
  assert.equal(avisos.exito.length, 0);
  assert.match(avisos.error[0], /SO-1: ya no está pendiente ni en planificación/);
});

test("el menú de prioridad solo se ofrece en los estados que el back acepta", () => {
  const render = (props) => renderToStaticMarkup(createElement(PrioridadSelector, { onCambiar: () => {}, ...props }));
  assert.match(render({ pedido: pedidoBandeja(1, "normal") }), /aria-label="Cambiar la prioridad de SO-1, ahora normal"/);
  assert.match(render({ pedido: pedidoBandeja(1, "urgent", "in_planning") }), /ahora urgente/);
  const fijo = render({ pedido: pedidoBandeja(5, "normal", "address_review") });
  assert.doesNotMatch(fijo, /Cambiar la prioridad/);
  assert.match(fijo, /solo se cambia en pedidos pendientes/);
  assert.match(render({ pedido: pedidoBandeja(1, "normal"), guardando: true }), /disabled=""[\s\S]*animate-spin/);
  // Sin función para cambiarla (vista de solo lectura) es un badge simple.
  assert.doesNotMatch(renderToStaticMarkup(createElement(PrioridadSelector, { pedido: pedidoBandeja(1, "normal") })), /button/);
});
