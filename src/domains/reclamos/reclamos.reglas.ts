import type { ApiError } from "@/shared/lib/api-error";
import type { Dictamen, DictamenInput, EstadoReclamo, Reclamo, ReclamosParams, SiguienteAccion } from "./types/reclamos.types";

export const RECLAMOS_POR_PAGINA = 20;

export const ESTADOS_RECLAMO: Record<EstadoReclamo, string> = {
  received: "Recibido",
  assigned: "Asignado",
  in_investigation: "En investigación",
  decided: "Con dictamen",
};

export const SIGUIENTES_ACCIONES: Record<SiguienteAccion, string> = {
  assign: "Tomar el caso",
  start_investigation: "Iniciar la investigación",
  issue_verdict: "Emitir dictamen",
  await_inventory_authorization: "Esperar a Inventarios",
  none: "Nada pendiente",
};

export const DICTAMENES: Record<Dictamen, { etiqueta: string; ayuda: string }> = {
  no_return_required: {
    etiqueta: "No requiere devolución",
    ayuda: "El reclamo procede, pero no hace falta recoger nada.",
  },
  request_RMA: {
    etiqueta: "Solicitar RMA",
    ayuda: "Se envía a Inventarios una solicitud pendiente de autorización. Aquí no se aprueba ni se crea un recojo.",
  },
  not_confirmed: {
    etiqueta: "No confirmado",
    ayuda: "La investigación no confirma lo reclamado.",
  },
};

export const CODIGOS_DICTAMEN = Object.keys(DICTAMENES) as Dictamen[];

export const etiquetaEstadoReclamo = (estado: string) => ESTADOS_RECLAMO[estado as EstadoReclamo] ?? estado;
export const etiquetaSiguienteAccion = (accion: string) => SIGUIENTES_ACCIONES[accion as SiguienteAccion] ?? accion;
export const etiquetaDictamen = (dictamen: string | null) =>
  dictamen ? DICTAMENES[dictamen as Dictamen]?.etiqueta ?? dictamen : "Sin dictamen";

/** Estado en palabras: un request_RMA sin respuesta de Inventarios se dice tal cual. */
export function estadoVisible(reclamo: Pick<Reclamo, "investigationStatus" | "authorizationPending">): string {
  if (reclamo.investigationStatus === "decided" && reclamo.authorizationPending) return "Autorización pendiente";
  return etiquetaEstadoReclamo(reclamo.investigationStatus);
}

const MS_HORA = 3_600_000;

/** Antigüedad desde que Despacho recibió el reclamo: «hace 45 min», «hace 5 h», «hace 3 d». */
export function antiguedad(recibido: string, ahora = Date.now()): string {
  const ms = Math.max(0, ahora - new Date(recibido).getTime());
  if (ms < MS_HORA) return `hace ${Math.max(1, Math.floor(ms / 60_000))} min`;
  if (ms < 24 * MS_HORA) return `hace ${Math.floor(ms / MS_HORA)} h`;
  return `hace ${Math.floor(ms / (24 * MS_HORA))} d`;
}

const fechaHora = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/La_Paz",
});

/** «24/11/2026, 14:05» en hora de Bolivia; «—» si no hay. */
export const formatearFechaReclamo = (valor: string | null) => (valor ? fechaHora.format(new Date(valor)) : "—");

/* ── Filtros (viven en la URL) ── */

export interface FiltrosReclamos {
  desde: string;
  hasta: string;
  zona: number | null;
  motivo: string;
  estado: EstadoReclamo | null;
  responsable: number | null;
  pagina: number;
}

export const filtrosReclamosPorDefecto = (): FiltrosReclamos => ({
  desde: "", hasta: "", zona: null, motivo: "", estado: null, responsable: null, pagina: 1,
});

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const entero = (valor: string | null) => (valor && /^\d+$/.test(valor) && Number(valor) > 0 ? Number(valor) : null);
const esEstado = (valor: string | null): valor is EstadoReclamo => valor !== null && valor in ESTADOS_RECLAMO;

export function leerFiltrosReclamos(url: URLSearchParams): FiltrosReclamos {
  const desde = url.get("desde") ?? "";
  const hasta = url.get("hasta") ?? "";
  const estado = url.get("estado");
  return {
    desde: FECHA.test(desde) ? desde : "",
    hasta: FECHA.test(hasta) ? hasta : "",
    zona: entero(url.get("zona")),
    motivo: (url.get("motivo") ?? "").slice(0, 64),
    estado: esEstado(estado) ? estado : null,
    responsable: entero(url.get("responsable")),
    pagina: entero(url.get("pagina")) ?? 1,
  };
}

/** Escribe solo los filtros con valor; conserva lo demás de la URL (p. ej. el caso abierto). */
export function escribirFiltrosReclamos(filtros: FiltrosReclamos, base: URLSearchParams): URLSearchParams {
  const url = new URLSearchParams(base);
  const poner = (clave: string, valor: string | number | null) => {
    if (valor === null || valor === "") url.delete(clave);
    else url.set(clave, String(valor));
  };
  poner("desde", filtros.desde);
  poner("hasta", filtros.hasta);
  poner("zona", filtros.zona);
  poner("motivo", filtros.motivo.trim());
  poner("estado", filtros.estado);
  poner("responsable", filtros.responsable);
  poner("pagina", filtros.pagina > 1 ? filtros.pagina : null);
  return url;
}

export const hayFiltrosReclamos = (f: FiltrosReclamos) =>
  Boolean(f.desde || f.hasta || f.zona || f.motivo.trim() || f.estado || f.responsable);

export type ProblemaFiltrosReclamos = "rango-invertido";

export const problemaFiltrosReclamos = (f: FiltrosReclamos): ProblemaFiltrosReclamos | null =>
  f.desde && f.hasta && f.desde > f.hasta ? "rango-invertido" : null;

export const MENSAJE_PROBLEMA_RECLAMOS: Record<ProblemaFiltrosReclamos, string> = {
  "rango-invertido": "La fecha «Desde» no puede ser posterior a «Hasta».",
};

export function paramsReclamos(f: FiltrosReclamos): ReclamosParams {
  const params: ReclamosParams = { page: f.pagina, limit: RECLAMOS_POR_PAGINA };
  if (f.desde) params.from = f.desde;
  if (f.hasta) params.to = f.hasta;
  if (f.zona) params.zoneId = f.zona;
  if (f.motivo.trim()) params.reasonCode = f.motivo.trim();
  if (f.estado) params.status = f.estado;
  if (f.responsable) params.assignedUserId = f.responsable;
  return params;
}

/* ── Dictamen ── */

export const MAX_MOTIVO_DICTAMEN = 500;
export const MAX_HALLAZGOS = 4000;
const ENLACE = /(https?:\/\/|www\.)/i;

export interface BorradorDictamen {
  verdict: Dictamen | null;
  decisionReason: string;
  findings: string;
}

export const borradorVacio = (): BorradorDictamen => ({ verdict: null, decisionReason: "", findings: "" });

export type ErroresDictamen = Partial<Record<keyof BorradorDictamen, string>>;

/** Mismas reglas del back: dictamen elegido, motivo 1–500, hallazgos 1–4000 y sin enlaces. */
export function validarDictamen(b: BorradorDictamen): ErroresDictamen {
  const errores: ErroresDictamen = {};
  const motivo = b.decisionReason.trim();
  const hallazgos = b.findings.trim();
  if (!b.verdict) errores.verdict = "Elige un dictamen.";
  if (!motivo) errores.decisionReason = "Escribe el motivo del dictamen.";
  else if (motivo.length > MAX_MOTIVO_DICTAMEN) errores.decisionReason = `El motivo tiene como máximo ${MAX_MOTIVO_DICTAMEN} caracteres.`;
  else if (ENLACE.test(motivo)) errores.decisionReason = "El motivo no puede tener enlaces.";
  if (!hallazgos) errores.findings = "Registra los hallazgos de la investigación.";
  else if (hallazgos.length > MAX_HALLAZGOS) errores.findings = `Los hallazgos tienen como máximo ${MAX_HALLAZGOS} caracteres.`;
  else if (ENLACE.test(hallazgos)) errores.findings = "Los hallazgos no pueden tener enlaces: la evidencia se referencia, no se publica.";
  return errores;
}

export const dictamenListo = (b: BorradorDictamen): DictamenInput | null =>
  Object.keys(validarDictamen(b)).length === 0 && b.verdict
    ? { verdict: b.verdict, decisionReason: b.decisionReason.trim(), findings: b.findings.trim() }
    : null;

/* ── Errores ── */

const MENSAJES: Record<string, string> = {
  INSUFFICIENT_PERMISSIONS: "No tienes permiso para ver ni trabajar reclamos.",
  INVALID_DATE_RANGE: "La fecha «Desde» no puede ser posterior a «Hasta».",
  COMPLAINT_CASE_NOT_FOUND: "Ese reclamo no existe o ya no está disponible.",
  COMPLAINT_CASE_VERSION_STALE: "El CRM actualizó este caso mientras lo veías. Cargamos la versión nueva; tu borrador se conserva.",
  INVALID_COMPLAINT_TRANSITION: "El caso cambió de estado. Revisa la versión actual antes de seguir.",
  INVALID_COMPLAINT_ASSIGNEE: "Solo se puede asignar a un coordinador o supervisor activo.",
  COMPLAINT_DISPATCH_NOT_DELIVERED: "Solo se investigan reclamos de despachos entregados.",
  COMPLAINT_REFERENCE_NOT_CORRELATED: "El caso no coincide con un despacho con el mismo código de seguimiento: no se puede investigar.",
  COMPLAINT_ORDER_REFERENCE_INVALID: "La referencia del pedido es demasiado larga para enviar la solicitud de RMA a Inventarios.",
};

export function mensajeErrorReclamos(error: ApiError): string {
  const porCodigo = error.code ? MENSAJES[error.code] : undefined;
  if (porCodigo) return porCodigo;
  if (error.status === 403) return MENSAJES.INSUFFICIENT_PERMISSIONS;
  if (error.status === 404) return MENSAJES.COMPLAINT_CASE_NOT_FOUND;
  if (error.kind === "network") return "No pudimos conectarnos con el servidor. Revisa tu conexión.";
  if (error.kind === "validation" && error.validationMessages.length > 0) return error.validationMessages.join(" ");
  return "No pudimos completar la acción. Intenta de nuevo.";
}

/** Tras estos errores hay que volver a leer el caso (la versión o el estado cambiaron). */
export const requiereReleer = (error: ApiError) =>
  error.code === "COMPLAINT_CASE_VERSION_STALE" || error.code === "INVALID_COMPLAINT_TRANSITION";
