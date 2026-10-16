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

const { parseApiError } = await server.ssrLoadModule("/src/shared/lib/api-error.ts");
const { mensajeErrorLote, requiereRecargarLote } = await server.ssrLoadModule("/src/domains/planificacion/planificacion.errores.ts");
const {
  mensajeAprobacion,
  opcionesAprobarPromesas,
  opcionesAsignarVehiculo,
  lotesKeys,
} = await server.ssrLoadModule("/src/domains/planificacion/planificacion.mutaciones.ts");
const { nivelOcupacion, formatearFechaTurno } = await server.ssrLoadModule("/src/domains/planificacion/planificacion.format.ts");
const { EstadoPedidoLoteBadge } = await server.ssrLoadModule("/src/domains/planificacion/components/estado-pedido-lote-badge.tsx");
const { OcupacionLote } = await server.ssrLoadModule("/src/domains/planificacion/components/ocupacion-lote.tsx");
const { LoteResumenCard } = await server.ssrLoadModule("/src/domains/planificacion/components/lote-resumen-card.tsx");
const { QueryClient, MutationObserver } = await server.ssrLoadModule("@tanstack/react-query");

/** Error de axios como lo arma el HttpExceptionFilter del back. */
const errorHttp = (status, code) => ({
  isAxiosError: true,
  response: { status, data: { statusCode: status, error: code, message: "msg" } },
});
const error = (status, code) => parseApiError(errorHttp(status, code));

const medida = (usedPercent) => ({ actual: usedPercent * 10, capacity: 1000, usedPercent, remaining: 0, excess: 0 });
const capacidad = (extra = {}) => ({
  estimatedDispatchIds: [],
  weight: medida(50),
  volume: medida(40),
  dimensionViolations: [],
  assignable: true,
  ...extra,
});

/* ---------- Errores y 409 ---------- */

test("los 409 de versión, lote no provisional o borrado obligan a recargar el lote", () => {
  for (const codigo of ["ROUTE_BATCH_VERSION_CONFLICT", "DISPATCH_VERSION_CONFLICT", "ROUTE_BATCH_NOT_PROVISIONAL"]) {
    assert.equal(requiereRecargarLote(error(409, codigo)), true, codigo);
  }
  assert.equal(requiereRecargarLote(error(404, "ROUTE_BATCH_NOT_FOUND")), true);
  // Capacidad o vehículo faltante: el lote sigue vigente, solo hay que corregir.
  assert.equal(requiereRecargarLote(error(409, "ROUTE_CAPACITY_EXCEEDED")), false);
  assert.equal(requiereRecargarLote(error(409, "ROUTE_BATCH_VEHICLE_REQUIRED")), false);
});

test("cada código del back tiene un mensaje claro y lo desconocido cae al genérico de la acción", () => {
  assert.match(mensajeErrorLote(error(409, "DISPATCH_VERSION_CONFLICT"), "aprobar"), /pedidos del lote cambiaron/);
  assert.match(mensajeErrorLote(error(403, "ROUTE_BATCH_REVIEWER_MISMATCH"), "aprobar"), /Solo el coordinador asignado/);
  assert.match(mensajeErrorLote(error(409, "ROUTE_CAPACITY_EXCEEDED"), "vehiculo"), /no entra en el vehículo/);
  assert.match(mensajeErrorLote(error(403, "INSUFFICIENT_PERMISSIONS"), "revisor"), /No tienes permisos/);
  assert.match(mensajeErrorLote(error(500), "vehiculo"), /^No se pudo cambiar el vehículo del lote\./);
});

/* ---------- Aviso de aprobación ---------- */

test("el aviso de aprobación cuenta pedidos, devueltos y correos enviados", () => {
  const texto = mensajeAprobacion({
    routeBatchId: 1, version: 2, approvedCount: 3, removedCount: 1, emailCount: 3,
    emailResults: [{ dispatchId: 1, result: "sent" }, { dispatchId: 2, result: "sent" }, { dispatchId: 3, result: "sent" }],
  });
  assert.equal(texto, "Promesas aprobadas: 3 pedidos aprobados, 1 devuelto a pendientes, 3 correos enviados.");
});

test("un correo rebotado se avisa para contactar al cliente, nunca como enviado", () => {
  const texto = mensajeAprobacion({
    routeBatchId: 1, version: 2, approvedCount: 2, removedCount: 0, emailCount: 2,
    emailResults: [{ dispatchId: 1, result: "sent" }, { dispatchId: 2, result: "bounced" }],
  });
  assert.match(texto, /1 correo enviado/);
  assert.match(texto, /1 rebotó: hay que contactar al cliente/);
  assert.doesNotMatch(texto, /devuelto/);
});

/* ---------- Mutaciones ---------- */

function preparar() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidadas = [];
  const original = queryClient.invalidateQueries.bind(queryClient);
  queryClient.invalidateQueries = (filtros) => {
    invalidadas.push(filtros.queryKey[0]);
    return original(filtros);
  };
  const avisos = { exito: [], error: [] };
  const avisar = { exito: (m) => avisos.exito.push(m), error: (m) => avisos.error.push(m) };
  return { queryClient, invalidadas, avisos, avisar };
}

const payload = { version: 4, dispatches: [{ dispatchId: 1, version: 2 }, { dispatchId: 2, version: 0 }], removeDispatchIds: [2] };

test("ante un 409 de versión se avisa, se recarga el lote y no se reintenta", async () => {
  const { queryClient, invalidadas, avisos, avisar } = preparar();
  let llamadas = 0;
  let recargas = 0;
  const mutacion = new MutationObserver(queryClient, opcionesAprobarPromesas({
    queryClient,
    avisar,
    alRecargar: () => { recargas += 1; },
    aprobar: async () => { llamadas += 1; throw errorHttp(409, "ROUTE_BATCH_VERSION_CONFLICT"); },
  }));

  await assert.rejects(mutacion.mutate({ loteId: 7, payload }));
  assert.equal(llamadas, 1);
  assert.equal(recargas, 1);
  assert.equal(avisos.error.length, 1);
  assert.match(avisos.error[0], /El lote cambió mientras lo revisabas/);
  assert.ok(invalidadas.includes(lotesKeys.all[0]));
});

test("al aprobar se manda el lote con sus versiones y los sacados, y se recargan lotes y bandeja", async () => {
  const { queryClient, invalidadas, avisos, avisar } = preparar();
  let recibido;
  const mutacion = new MutationObserver(queryClient, opcionesAprobarPromesas({
    queryClient,
    avisar,
    aprobar: async (id, cuerpo) => {
      recibido = { id, cuerpo };
      return { routeBatchId: id, version: 5, approvedCount: 1, removedCount: 1, emailCount: 1, emailResults: [{ dispatchId: 1, result: "sent" }] };
    },
  }));

  await mutacion.mutate({ loteId: 7, payload });
  assert.deepEqual(recibido, { id: 7, cuerpo: payload });
  assert.equal(avisos.exito[0], "Promesas aprobadas: 1 pedido aprobado, 1 devuelto a pendientes, 1 correo enviado.");
  assert.ok(invalidadas.includes("route-batches"));
  assert.ok(invalidadas.includes("pending-orders"));
});

test("si la carga no entra en el vehículo se explica y no se fuerza recarga", async () => {
  const { queryClient, avisos, avisar } = preparar();
  let recargas = 0;
  const mutacion = new MutationObserver(queryClient, opcionesAsignarVehiculo({
    queryClient,
    avisar,
    alRecargar: () => { recargas += 1; },
    asignar: async () => { throw errorHttp(409, "ROUTE_CAPACITY_EXCEEDED"); },
  }));

  await assert.rejects(mutacion.mutate({ loteId: 7, vehicleId: 3 }));
  assert.match(avisos.error[0], /no entra en el vehículo/);
  assert.equal(recargas, 0);
});

test("al cambiar el vehículo el aviso usa la mayor ocupación entre peso y volumen", async () => {
  const { queryClient, avisos, avisar } = preparar();
  const mutacion = new MutationObserver(queryClient, opcionesAsignarVehiculo({
    queryClient,
    avisar,
    asignar: async (id, vehicleId) => ({ routeBatchId: id, vehicleId, capacity: capacidad({ weight: medida(62.4), volume: medida(81.6) }) }),
  }));

  await mutacion.mutate({ loteId: 7, vehicleId: 3 });
  assert.equal(avisos.exito[0], "Vehículo cambiado. La carga ocupa el 82 % de su capacidad.");
});

/* ---------- Formato ---------- */

test("la ocupación pasa a alta desde el 90 % y a excedida sobre el 100 %", () => {
  assert.equal(nivelOcupacion(89.9), "normal");
  assert.equal(nivelOcupacion(90), "alta");
  assert.equal(nivelOcupacion(100), "alta");
  assert.equal(nivelOcupacion(100.1), "excedida");
});

test("la fecha del turno no se corre un día por la zona horaria", () => {
  assert.match(formatearFechaTurno("2026-10-17"), /17\/10/);
  assert.equal(formatearFechaTurno("sin-fecha"), "sin-fecha");
});

/* ---------- Componentes ---------- */

test("el badge distingue propuesto, en planificación por otro y en tu planificación", () => {
  const render = (props) => renderToStaticMarkup(createElement(EstadoPedidoLoteBadge, props));
  assert.match(render({}), /Propuesto/);
  const deOtro = render({ reservadoPor: { nombre: "Ana Rojas", esMio: false } });
  assert.match(deOtro, /En planificación por Ana Rojas/);
  assert.match(deOtro, /text-warning/);
  assert.match(render({ reservadoPor: { nombre: "Yo", esMio: true } }), /En tu planificación/);
});

test("la ocupación avisa si la carga no entra y si hay pesos estimados", () => {
  const html = renderToStaticMarkup(createElement(OcupacionLote, {
    capacidad: capacidad({
      weight: medida(112),
      assignable: false,
      estimatedDispatchIds: [4, 5],
      dimensionViolations: [{ dispatchId: 4, packageId: 9, exceeded: [{ dimension: "widthCm", actual: 125, maximum: 100 }] }],
    }),
  }));
  assert.match(html, /La carga no entra en este vehículo/);
  assert.match(html, /1 bulto excede sus medidas/);
  assert.match(html, /2 pedidos no tienen bultos registrados/);
  assert.match(html, /bg-destructive/);
  // La barra nunca pasa del 100 % de ancho aunque la carga se pase.
  assert.match(html, /width:100%/);
});

test("la tarjeta del lote muestra sus datos y pide vehículo cuando no tiene", () => {
  const base = { titulo: "Lote #12", zona: "Zona Sur", fecha: "2026-10-17", cantidadPedidos: 1, revisor: null };
  const sinVehiculo = renderToStaticMarkup(createElement(LoteResumenCard, { ...base, vehiculo: null, ocupacion: null }));
  assert.match(sinVehiculo, /Lote #12/);
  assert.match(sinVehiculo, /1 pedido</);
  assert.match(sinVehiculo, /Sin vehículo/);
  assert.match(sinVehiculo, /Sin asignar/);
  assert.match(sinVehiculo, /Asigna un vehículo para ver la ocupación/);
  assert.doesNotMatch(sinVehiculo, /<button/);

  const seleccionable = renderToStaticMarkup(createElement(LoteResumenCard, {
    ...base, vehiculo: "2345-ABC", ocupacion: 95, seleccionado: true, onSeleccionar: () => {},
  }));
  assert.match(seleccionable, /<button[^>]*aria-pressed="true"/);
  assert.match(seleccionable, /2345-ABC/);
  assert.match(seleccionable, /bg-warning/);
});
