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

const { crearParametrosSchema, CLAVES_PARAMETROS_OPERATIVOS } = await server.ssrLoadModule("/src/domains/configuracion/configuracion.schemas.ts");
const { planificarGuardado } = await server.ssrLoadModule("/src/domains/configuracion/configuracion.guardado.ts");
const { validarCruces } = await server.ssrLoadModule("/src/domains/configuracion/configuracion.reglas.ts");
const { ParametrosForm } = await server.ssrLoadModule("/src/domains/configuracion/components/parametros-form.tsx");

const ventanaGeneral = { inicio: "08:00", fin: "20:00" };
const actuales = {
  morning_window_start: "09:00", morning_window_end: "13:00", afternoon_window_start: "14:00", afternoon_window_end: "18:00",
  slot_duration_minutes: "120", service_min_operating_days: "2", service_max_operating_days: "3",
  promise_response_window_minutes: "720", plan_generation_times: "08:30,13:30", plan_horizon_days: "4",
  plan_working_days: "1,2,3,4,5", plan_non_working_dates: "", stop_service_minutes: "", planning_margin_pct: "",
  route_cutoff_time: "15:00", final_review_end_time: "16:00", route_reminder_time: "16:30",
  final_review_escalation_time: "07:00", warehouse_prep_end_time: "08:15", warehouse_prep_lead_minutes: "",
  max_reschedule_attempts: "2", reschedule_window_days: "2", reschedule_code_expiry_minutes: "",
  max_wait_time_min: "15", max_delivery_attempts: "3",
};
const sinDefinir = new Set(CLAVES_PARAMETROS_OPERATIVOS.filter((clave) => actuales[clave] === ""));
const esquema = crearParametrosSchema({ ventanaGeneral, clavesSinDefinir: sinDefinir });

/** Errores del esquema como { clave: mensaje }. */
function errores(valores) {
  const resultado = esquema.safeParse(valores);
  return resultado.success ? {} : Object.fromEntries(resultado.error.issues.map((issue) => [issue.path[0], issue.message]));
}

test("los valores actuales del back son válidos, con las claves sin definir vacías", () => {
  assert.deepEqual(errores(actuales), {});
});

test("una ventana inconsistente se marca bajo el campo que la rompe", () => {
  assert.match(errores({ ...actuales, morning_window_end: "08:30" }).morning_window_end, /posterior al inicio/);
  assert.match(errores({ ...actuales, afternoon_window_end: "21:00" }).afternoon_window_end, /dentro del horario de reparto/);
});

test("las dos cadenas de horas se validan por separado", () => {
  const diaAnterior = errores({ ...actuales, route_cutoff_time: "16:30" });
  assert.match(diaAnterior.final_review_end_time, /posterior al corte de rutas/);
  assert.equal(diaAnterior.warehouse_prep_end_time, undefined);

  const diaSalida = errores({ ...actuales, warehouse_prep_end_time: "06:00" });
  assert.match(diaSalida.warehouse_prep_end_time, /posterior al escalamiento/);
  assert.equal(diaSalida.final_review_end_time, undefined);
});

test("un umbral menor a 1 se rechaza", () => {
  assert.match(errores({ ...actuales, max_wait_time_min: "0" }).max_wait_time_min, /al menos 1/);
  assert.match(errores({ ...actuales, max_delivery_attempts: "" }).max_delivery_attempts, /obligatorio/);
  assert.match(errores({ ...actuales, plan_generation_times: "8:30" }).plan_generation_times, /HH:mm/);
});

test("el guardado envía solo lo que cambió y en un orden que el back acepta paso a paso", () => {
  const nuevos = { ...actuales, morning_window_start: "14:00", morning_window_end: "16:00", max_wait_time_min: "10" };
  const cambios = planificarGuardado(actuales, nuevos, ventanaGeneral);
  assert.deepEqual(cambios.map(({ clave }) => clave).sort(), ["max_wait_time_min", "morning_window_end", "morning_window_start"]);
  // Simula el back: después de cada PUT la configuración completa sigue siendo válida.
  const estado = { ...actuales };
  for (const { clave, valor } of cambios) {
    estado[clave] = valor;
    assert.deepEqual(validarCruces(estado, ventanaGeneral), [], `quedó inválido al guardar ${clave}`);
  }
  assert.deepEqual(estado, nuevos);
});

test("sin cambios no se envía nada y las claves sin definir vacías no se mandan", () => {
  assert.deepEqual(planificarGuardado(actuales, { ...actuales }, ventanaGeneral), []);
  assert.equal(planificarGuardado(actuales, { ...actuales, morning_window_end: "08:30" }, ventanaGeneral), null);
});

test("el formulario muestra los 7 grupos, los 25 campos y las marcas de propuesto y sin definir", () => {
  const estados = Object.fromEntries(CLAVES_PARAMETROS_OPERATIVOS.map((clave) => [clave, "definido"]));
  estados.route_cutoff_time = "propuesto";
  estados.stop_service_minutes = "sin-definir";
  const html = renderToStaticMarkup(createElement(ParametrosForm, {
    valores: actuales, estados, clavesSinDefinir: sinDefinir, ventanaGeneral, onGuardar: async () => null,
  }));
  assert.equal((html.match(/<section/g) ?? []).length, 7);
  assert.equal((html.match(/<input/g) ?? []).length, 25);
  assert.match(html, /Propuesto/);
  assert.match(html, /Sin definir/);
  assert.match(html, /Guardar cambios/);
});
