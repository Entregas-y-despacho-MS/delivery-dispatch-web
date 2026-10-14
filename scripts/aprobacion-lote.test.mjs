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
