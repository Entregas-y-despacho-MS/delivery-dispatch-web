import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

// El cliente público lee VITE_API_URL al cargarse; en las pruebas no hay .env obligatorio.
process.env.VITE_API_URL ??= "http://localhost:3001/api";

const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(async () => server.close());

const cargar = (ruta) => server.ssrLoadModule(`/src/domains/seguimiento/${ruta}`);
const { SeguimientoResumen } = await cargar("components/seguimiento-resumen.tsx");
const { SeguimientoError } = await cargar("components/seguimiento-error.tsx");
const { AccionesAutoservicio } = await cargar("components/acciones-autoservicio.tsx");
const { SolicitarCambioForm } = await cargar("components/solicitar-cambio-form.tsx");
const { PasoPedirCodigo, PasoVerificarCodigo, PasoElegirFranja } = await cargar("components/reprogramacion-pasos.tsx");
const { vistaError, mensajeErrorSeguimiento, intentosRestantes, requiereNuevoCodigo, reprogramacionCerrada } = await cargar("seguimiento.errores.ts");
const { avisoAutoservicio, formatearFechaEntrega, formatearFranjaEntrega } = await cargar("seguimiento.format.ts");
const servicio = await cargar("services/tracking-publico.service.ts");
const { publicApi } = await server.ssrLoadModule("/src/shared/lib/public-api.ts");
const { parseApiError } = await server.ssrLoadModule("/src/shared/lib/api-error.ts");

const html = (componente, props) => renderToStaticMarkup(createElement(componente, props));
const nada = () => {};
const errorHttp = (status, code, details) => ({
  isAxiosError: true,
  response: { status, data: { statusCode: status, error: code, message: "msg", ...(details ? { details } : {}) } },
});

const abierto = {
  open: true, closedReason: null, windowClosesAt: "2026-10-19T00:30:00.000Z", rescheduleAttemptsLeft: 2,
  canConfirm: true, canReschedule: true, canRequestChange: true,
};
const pedido = {
  trackingCode: "TRK-0001", status: "scheduled", customerConfirmation: "pending", deliveryDate: "2026-10-19",
  windowStart: "2026-10-19T12:00:00.000Z", windowEnd: "2026-10-19T14:00:00.000Z", selfService: abierto,
};
const acciones = (autoservicio) => html(AccionesAutoservicio, {
  autoservicio, confirmando: false, error: null, onConfirmar: nada, onReprogramar: nada, onSolicitarCambio: nada,
});

test("el resumen muestra estado, fecha y franja en hora de Bolivia, sin datos sensibles", () => {
  const vista = html(SeguimientoResumen, { pedido });
  assert.match(vista, /Entrega programada/);
  assert.match(vista, /lunes, 19 de octubre/);
  assert.match(vista, /08:00 a 10:00/);
  assert.match(vista, /TRK-0001/);
  assert.match(vista, /Esperando tu respuesta/);
  assert.match(vista, /puedes responder hasta el 18\/10/);
  assert.doesNotMatch(vista, /direcci|tel[eé]fono|OTP/i);
  assert.equal(formatearFechaEntrega(null), "Todavía sin fecha");
  assert.equal(formatearFranjaEntrega(null, null), "Todavía sin horario");
});

test("un enlace inválido o vencido no ofrece reintentar; el límite por IP y los errores sí", () => {
  assert.equal(vistaError(parseApiError(errorHttp(404, "TRACKING_LINK_NOT_FOUND"))), "enlace-invalido");
  assert.equal(vistaError(parseApiError(errorHttp(429, "TOO_MANY_REQUESTS"))), "demasiados-intentos");
  assert.equal(vistaError(parseApiError(errorHttp(500))), "error");

  const invalido = html(SeguimientoError, { vista: "enlace-invalido", onReintentar: nada, reintentando: false });
  assert.match(invalido, /no es válido o ya venció/);
  assert.doesNotMatch(invalido, /Reintentar/);
  assert.match(html(SeguimientoError, { vista: "demasiados-intentos", onReintentar: nada, reintentando: false }), /Demasiados intentos[\s\S]*Reintentar/);
  assert.match(html(SeguimientoError, { vista: "error", onReintentar: nada, reintentando: false }), /No pudimos cargar tu pedido[\s\S]*Reintentar/);
});

test("dentro de la ventana se puede confirmar, elegir otro horario o pedir un cambio", () => {
  const vista = acciones(abierto);
  assert.match(vista, /Confirmar entrega/);
  assert.match(vista, /Elegir otro horario/);
  assert.match(vista, /Solicitar un cambio/);
  assert.match(vista, /quedan 2 cambios de horario/);
  assert.match(acciones({ ...abierto, rescheduleAttemptsLeft: 1 }), /queda 1 cambio de horario/);
});

test("con la ventana vencida o sin intentos solo queda solicitar un cambio", () => {
  const cerrado = { ...abierto, open: false, canConfirm: false, canReschedule: false };
  const vencida = acciones({ ...cerrado, closedReason: "window_elapsed" });
  assert.match(vencida, /El plazo para confirmar o elegir otro horario ya venció/);
  assert.match(vencida, /Solicitar un cambio/);
  assert.doesNotMatch(vencida, /Confirmar entrega|Elegir otro horario/);
  assert.match(acciones({ ...cerrado, closedReason: "max_attempts" }), /todos tus cambios de horario/);

  const yaPidio = acciones({ ...cerrado, closedReason: "change_requested", canRequestChange: false });
  assert.match(yaPidio, /Ya enviaste una solicitud de cambio/);
  assert.doesNotMatch(yaPidio, /<button/);
});

test("si no se puede reprogramar (sin correo o sin configurar) no se ofrece y se sugiere pedir un cambio", () => {
  const sinCorreo = { ...abierto, canReschedule: false };
  assert.match(avisoAutoservicio(sinCorreo), /no puedes elegir otro horario desde este enlace\. Si lo necesitas, solicita un cambio/);
  assert.doesNotMatch(acciones(sinCorreo), /Elegir otro horario/);
  assert.equal(avisoAutoservicio(abierto), null);
});

test("la solicitud de cambio limita el texto a 500 caracteres y empieza deshabilitada", () => {
  const vista = html(SolicitarCambioForm, { enviando: false, error: null, onEnviar: nada, onCancelar: nada });
  assert.match(vista, /maxLength="500"/);
  assert.match(vista, /0\/500/);
  assert.match(vista, /type="submit" disabled=""/);
});

test("la verificación avisa a qué correo fue el código, sin mostrarlo completo", () => {
  assert.match(html(PasoPedirCodigo, { enviando: false, error: null, onPedir: nada, onCancelar: nada }), /No es el código de entrega/);
  const vista = html(PasoVerificarCodigo, {
    envio: { sentTo: "c***@correo.test", expiresAt: "2026-10-18T23:40:00.000Z" },
    verificando: false, reenviando: false, error: null, intentos: null,
    onVerificar: nada, onReenviar: nada, onCancelar: nada,
  });
  assert.match(vista, /c\*\*\*@correo\.test/);
  assert.match(vista, /Vence a las 19:40/);
  assert.match(vista, /autoComplete="one-time-code"/);
  assert.match(vista, /maxLength="6"/);
});

test("un código incorrecto dice cuántos intentos quedan; uno vencido obliga a pedir otro", () => {
  const incorrecto = errorHttp(400, "INVALID_VERIFICATION_CODE", { attemptsLeft: 3 });
  assert.equal(intentosRestantes(incorrecto), 3);
  assert.equal(intentosRestantes(errorHttp(400, "VERIFICATION_CODE_EXPIRED")), null);
  const mensaje = mensajeErrorSeguimiento(parseApiError(incorrecto));
  assert.equal(mensaje, "El código no es correcto.");
  const vista = html(PasoVerificarCodigo, {
    envio: { sentTo: "c***@correo.test", expiresAt: "2026-10-18T23:40:00.000Z" },
    verificando: false, reenviando: false, error: mensaje, intentos: 3,
    onVerificar: nada, onReenviar: nada, onCancelar: nada,
  });
  assert.match(vista, /El código no es correcto\. Te quedan 3 intentos\./);

  assert.equal(requiereNuevoCodigo(parseApiError(errorHttp(400, "VERIFICATION_CODE_EXPIRED"))), true);
  assert.equal(requiereNuevoCodigo(parseApiError(errorHttp(403, "VERIFICATION_REQUIRED"))), true);
  assert.equal(requiereNuevoCodigo(parseApiError(incorrecto)), false);
  assert.equal(reprogramacionCerrada(parseApiError(errorHttp(409, "RESCHEDULE_NOT_AVAILABLE"))), true);
  assert.match(mensajeErrorSeguimiento(parseApiError(errorHttp(429, "VERIFICATION_CODE_RATE_LIMITED"))), /demasiados códigos/);
  assert.match(mensajeErrorSeguimiento(parseApiError(errorHttp(503, "VERIFICATION_CODE_NOT_SENT"))), /No pudimos enviar el código/);
});

test("las franjas se listan para elegir y, si no hay, se indica contactar a Despacho", () => {
  const props = { cargando: false, error: null, eligiendo: false, errorEleccion: null, onElegir: nada, onReintentar: nada, onSolicitarCambio: nada, onCancelar: nada };
  const sinFranjas = html(PasoElegirFranja, { ...props, franjas: { slots: [], unavailableReason: "no_slots" } });
  assert.match(sinFranjas, /Comunícate con Despacho/);
  assert.match(sinFranjas, /Solicitar un cambio/);

  const conFranjas = html(PasoElegirFranja, {
    ...props,
    franjas: { unavailableReason: null, slots: [{ slotId: "105.1792866000", deliveryDate: "2026-10-20", windowStart: "2026-10-20T14:00:00.000Z", windowEnd: "2026-10-20T16:00:00.000Z" }] },
  });
  assert.match(conFranjas, /martes, 20 de octubre/);
  assert.match(conFranjas, /10:00 a 12:00/);
  assert.match(conFranjas, /Cambiar a este horario/);
  assert.match(mensajeErrorSeguimiento(parseApiError(errorHttp(409, "SLOT_NO_LONGER_AVAILABLE"))), /ya se ocupó/);
});

test("la prueba de verificación va en la cabecera, nunca en la URL, y el cliente público no manda sesión", async () => {
  const pedidas = [];
  const original = publicApi.defaults.adapter;
  publicApi.defaults.adapter = async (config) => {
    pedidas.push(config);
    return { data: { slots: [], unavailableReason: "no_slots" }, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    await servicio.listarFranjas("tok/en", "prueba-123");
    await servicio.reprogramarEntrega("tok/en", "105.1792866000", "prueba-123");
    await servicio.verificarCodigo("tok/en", "482913");
  } finally {
    publicApi.defaults.adapter = original;
  }
  const [franjas, reprogramar, verificar] = pedidas;
  assert.equal(franjas.url, "/public/tracking/tok%2Fen/slots");
  assert.equal(franjas.headers["X-Verification-Proof"], "prueba-123");
  assert.equal(reprogramar.url, "/public/tracking/tok%2Fen/reschedule");
  assert.equal(JSON.parse(reprogramar.data).slotId, "105.1792866000");
  assert.equal(reprogramar.headers["X-Verification-Proof"], "prueba-123");
  assert.equal(JSON.parse(verificar.data).code, "482913");
  for (const pedida of pedidas) {
    assert.doesNotMatch(pedida.url, /prueba-123/);
    assert.equal(pedida.headers.Authorization, undefined);
  }
});
