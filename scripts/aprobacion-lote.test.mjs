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

const { calcularCapacidad, puedeAprobarPorCapacidad } = await server.ssrLoadModule("/src/domains/planificacion/planificacion.capacidad.ts");
const { BarraCapacidad } = await server.ssrLoadModule("/src/domains/planificacion/components/capacidad-vehiculo.tsx");
const { describirRelojRevision } = await server.ssrLoadModule("/src/domains/planificacion/planificacion.reloj.ts");
const { RelojRevisionLote } = await server.ssrLoadModule("/src/domains/planificacion/components/reloj-revision.tsx");
const { opcionesAprobarLoteFinal, mensajeAprobacionFinal } = await server.ssrLoadModule("/src/domains/planificacion/planificacion.mutaciones.ts");
const { mensajeErrorLote, requiereRecargarLote } = await server.ssrLoadModule("/src/domains/planificacion/planificacion.errores.ts");
const { parseApiError } = await server.ssrLoadModule("/src/shared/lib/api-error.ts");
const { QueryClient, MutationObserver } = await server.ssrLoadModule("@tanstack/react-query");

const barra = (capacidad) => renderToStaticMarkup(createElement(BarraCapacidad, { capacidad }));

test("la capacidad se clasifica en normal, cerca del límite y excedida", () => {
  assert.deepEqual(calcularCapacidad("peso", { usado: 400, capacidad: 800 }), {
    medida: "peso", usado: 400, capacidad: 800, porcentaje: 50, exceso: 0, estado: "normal",
  });
  assert.equal(calcularCapacidad("peso", { usado: 720, capacidad: 800 }).estado, "alta");
  assert.equal(calcularCapacidad("peso", { usado: 800, capacidad: 800 }).estado, "alta", "justo el 100 % todavía cabe");
  const excedida = calcularCapacidad("peso", { usado: 845.5, capacidad: 800 });
  assert.equal(excedida.estado, "excedida");
  assert.equal(excedida.exceso, 45.5);
  assert.equal(excedida.porcentaje, 106);
});

test("el exceso es exacto aunque los totales vengan con decimales", () => {
  assert.equal(calcularCapacidad("volumen", { usado: 0.1 + 0.2 + 7.2, capacidad: 7.4 }).exceso, 0.1);
  assert.equal(calcularCapacidad("volumen", { usado: 7.4, capacidad: 7.4 }).exceso, 0);
});

test("un vehículo sin capacidad registrada no se puede comparar", () => {
  const sin = calcularCapacidad("volumen", { usado: 2, capacidad: null });
  assert.equal(sin.estado, "sin-capacidad");
  assert.equal(sin.porcentaje, null);
});

test("la aprobación se bloquea si el peso o el volumen superan la capacidad, con el exceso exacto", () => {
  const ok = puedeAprobarPorCapacidad([
    calcularCapacidad("peso", { usado: 790, capacidad: 800 }),
    calcularCapacidad("volumen", { usado: 4.2, capacidad: 7.5 }),
  ]);
  assert.deepEqual(ok, { permitida: true, motivos: [] });

  const bloqueada = puedeAprobarPorCapacidad([
    calcularCapacidad("peso", { usado: 845.5, capacidad: 800 }),
    calcularCapacidad("volumen", { usado: 7.9, capacidad: 7.5 }),
  ]);
  assert.equal(bloqueada.permitida, false);
  assert.deepEqual(bloqueada.motivos, [
    "El peso supera la capacidad del vehículo por 45,5 kg.",
    "El volumen supera la capacidad del vehículo por 0,4 m³.",
  ]);

  const sinDatos = puedeAprobarPorCapacidad([calcularCapacidad("peso", { usado: 10, capacidad: null })]);
  assert.equal(sinDatos.permitida, false);
});

test("la barra muestra el uso, el porcentaje y el exceso, y se lee con lector de pantalla", () => {
  const excedida = barra(calcularCapacidad("peso", { usado: 845.5, capacidad: 800 }));
  assert.match(excedida, /845,5 kg \/ 800 kg · 106 %/);
  assert.match(excedida, /role="meter"/);
  assert.match(excedida, /aria-valuenow="106"/);
  assert.match(excedida, /width:100%/, "la barra no se sale de su caja");
  assert.match(excedida, /Excede por <!-- -->45,5 kg|Excede por 45,5 kg/);
  assert.match(excedida, /bg-destructive/);

  const normal = barra(calcularCapacidad("volumen", { usado: 4.2, capacidad: 7.5 }));
  assert.match(normal, /width:56%/);
  assert.match(normal, /Dentro de la capacidad/);
  assert.doesNotMatch(normal, /Excede/);

  assert.match(barra(calcularCapacidad("peso", { usado: 760, capacidad: 800 })), /Cerca del límite/);
  assert.match(barra(calcularCapacidad("peso", { usado: 5, capacidad: null })), /no tiene esta capacidad registrada/);
});

/* ---------- Reloj de revisión (lote que sale el 17/10; Bolivia es UTC-4) ---------- */

const reloj = { fechaTurno: "2026-10-17", finRevision: "16:00", escalamiento: "07:00" };
const en = (iso) => Date.parse(iso);

test("la revisión vence el día anterior a la salida y avisa cuando queda menos de una hora", () => {
  const enPlazo = describirRelojRevision(reloj, en("2026-10-16T18:00:00Z"));
  assert.equal(enPlazo.estado, "en-plazo");
  assert.equal(enPlazo.texto, "Quedan 2 h para aprobar (hasta las 16:00 del día anterior)");
  assert.equal(enPlazo.finRevision.toISOString(), "2026-10-16T20:00:00.000Z");
  assert.equal(describirRelojRevision(reloj, en("2026-10-16T19:30:00Z")).estado, "proximo");
});

test("después del fin de la revisión queda vencida y el día de salida escala a incidencia", () => {
  const vencido = describirRelojRevision(reloj, en("2026-10-16T21:15:00Z"));
  assert.equal(vencido.estado, "vencido");
  assert.equal(vencido.texto, "Revisión vencida hace 1 h 15 min · se escala a las 07:00");
  const escalado = describirRelojRevision(reloj, en("2026-10-17T11:00:00Z"));
  assert.equal(escalado.estado, "escalado");
  assert.equal(escalado.escalamiento.toISOString(), "2026-10-17T11:00:00.000Z");
});

test("sin las horas configuradas el reloj no inventa un plazo", () => {
  assert.equal(describirRelojRevision({ ...reloj, finRevision: "" }, 0).estado, "sin-configurar");
  assert.equal(describirRelojRevision({ ...reloj, escalamiento: "7" }, 0).estado, "sin-configurar");
});

test("el reloj vencido se pinta en rojo y se anuncia como estado", () => {
  const html = renderToStaticMarkup(createElement(RelojRevisionLote, { ...reloj, ahora: en("2026-10-16T21:15:00Z") }));
  assert.match(html, /role="status"/);
  assert.match(html, /text-destructive/);
  assert.match(html, /Revisión vencida hace 1 h 15 min/);
});

/* ---------- 2.ª aprobación ---------- */

const errorHttp = (status, code) => ({ isAxiosError: true, response: { status, data: { statusCode: status, error: code, message: "msg" } } });

function preparar() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidadas = [];
  const original = queryClient.invalidateQueries.bind(queryClient);
  queryClient.invalidateQueries = (filtros) => { invalidadas.push(filtros.queryKey[0]); return original(filtros); };
  const avisos = { exito: [], error: [] };
  return { queryClient, invalidadas, avisos, avisar: { exito: (m) => avisos.exito.push(m), error: (m) => avisos.error.push(m) } };
}

const payloadFinal = { version: 3, dispatches: [{ dispatchId: 1, version: 4 }, { dispatchId: 2, version: 1 }] };

test("al aprobar el lote se manda con sus versiones, se avisa y se recargan lotes y bandeja", async () => {
  const { queryClient, invalidadas, avisos, avisar } = preparar();
  let recibido;
  const mutacion = new MutationObserver(queryClient, opcionesAprobarLoteFinal({
    queryClient,
    avisar,
    aprobar: async (id, cuerpo) => { recibido = { id, cuerpo }; return { routeBatchId: id, version: 4, driverId: 9, vehicleId: 3, dispatchIds: [1, 2] }; },
  }));
  await mutacion.mutate({ loteId: 12, payload: payloadFinal });
  assert.deepEqual(recibido, { id: 12, cuerpo: payloadFinal });
  assert.equal(avisos.exito[0], "Lote aprobado: 2 pedidos asignados al conductor y al vehículo.");
  assert.ok(invalidadas.includes("route-batches"));
  assert.ok(invalidadas.includes("pending-orders"));
  assert.equal(mensajeAprobacionFinal({ dispatchIds: [1] }), "Lote aprobado: 1 pedido asignado al conductor y al vehículo.");
});

test("un 409 por recursos compartidos muestra el conflicto, recarga el lote y no reintenta", async () => {
  const { queryClient, avisos, avisar } = preparar();
  let llamadas = 0;
  let recargas = 0;
  const mutacion = new MutationObserver(queryClient, opcionesAprobarLoteFinal({
    queryClient,
    avisar,
    alRecargar: () => { recargas += 1; },
    aprobar: async () => { llamadas += 1; throw errorHttp(409, "ROUTE_BATCH_RESOURCE_CONFLICT"); },
  }));
  await assert.rejects(mutacion.mutate({ loteId: 12, payload: payloadFinal }));
  assert.equal(llamadas, 1);
  assert.equal(recargas, 1);
  assert.match(avisos.error[0], /ya no está disponible para esa fecha/);
});

test("los rechazos de la 2.ª aprobación se explican y solo los de lote vigente o recursos recargan", () => {
  const error = (code) => parseApiError(errorHttp(409, code));
  assert.equal(requiereRecargarLote(error("ROUTE_BATCH_NOT_PENDING_FINAL_REVIEW")), true);
  assert.equal(requiereRecargarLote(error("ROUTE_BATCH_DRIVER_NOT_AVAILABLE")), true);
  assert.equal(requiereRecargarLote(error("DISPATCH_ORDER_IN_MULTIPLE_BATCHES")), true);
  assert.equal(requiereRecargarLote(error("DISPATCH_PACKAGES_REQUIRED")), false);
  assert.equal(requiereRecargarLote(error("ROUTE_BATCH_DRIVER_REQUIRED")), false);
  assert.match(mensajeErrorLote(error("DISPATCH_PACKAGES_REQUIRED"), "aprobar-final"), /bultos registrados/);
  assert.match(mensajeErrorLote(error("ROUTE_BATCH_DRIVER_REQUIRED"), "aprobar-final"), /conductor propuesto/);
  assert.match(mensajeErrorLote(parseApiError(errorHttp(500)), "aprobar-final"), /^No se pudo aprobar el lote\./);
});
