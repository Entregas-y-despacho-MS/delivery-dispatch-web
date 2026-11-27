import type { ApiError } from "@/shared/lib/api-error";
import type { AuditoriaParams, OrdenAuditoria, ResultadoAuditoria } from "./types/auditoria.types";

/** Catálogo de acciones auditadas (RF-A35), igual al del back, con su entidad. */
export const ACCIONES_AUDITORIA = {
  "user.created": { etiqueta: "Usuario creado", entidad: "user" },
  "user.updated": { etiqueta: "Usuario editado", entidad: "user" },
  "user.role_changed": { etiqueta: "Cambio de rol", entidad: "user" },
  "user.deleted": { etiqueta: "Usuario eliminado", entidad: "user" },
  "auth.two_factor_changed": { etiqueta: "Cambio de doble factor", entidad: "user" },
  "auth.password_changed": { etiqueta: "Cambio de contraseña", entidad: "user" },
  "setting.updated": { etiqueta: "Parámetro modificado", entidad: "setting" },
  "catalog.changed": { etiqueta: "Catálogo modificado", entidad: "catalog" },
  "vehicle.changed": { etiqueta: "Vehículo modificado", entidad: "vehicle" },
  "tracking_link.revealed": { etiqueta: "Enlace de seguimiento revelado", entidad: "dispatch" },
  "audit.exported": { etiqueta: "Auditoría exportada", entidad: "audit" },
  "planning.run": { etiqueta: "Planificación ejecutada", entidad: "planning" },
  "route_batch.approved": { etiqueta: "Lote aprobado", entidad: "route_batch" },
  "route_batch.assignment_changed": { etiqueta: "Asignación de lote cambiada", entidad: "route_batch" },
  "dispatch.cancelled": { etiqueta: "Despacho cancelado", entidad: "dispatch" },
  "dispatch.rescheduled": { etiqueta: "Despacho reprogramado", entidad: "dispatch" },
} as const;

export type AccionAuditoria = keyof typeof ACCIONES_AUDITORIA;
export const CODIGOS_ACCION = Object.keys(ACCIONES_AUDITORIA) as AccionAuditoria[];

export const ENTIDADES_AUDITORIA: Record<string, string> = {
  user: "Usuario",
  setting: "Parámetro",
  catalog: "Catálogo",
  vehicle: "Vehículo",
  dispatch: "Despacho",
  audit: "Auditoría",
  planning: "Planificación",
  route_batch: "Lote de ruta",
};

export const ROLES_AUDITORIA: Record<string, string> = {
  root: "Root",
  admin: "Administrador",
  coordinator: "Coordinador",
  supervisor: "Supervisor",
  driver: "Repartidor",
};

export const RESULTADOS_AUDITORIA: Record<ResultadoAuditoria, string> = {
  success: "Exitoso",
  denied: "Denegado",
  failed: "Fallido",
};

export const etiquetaAccion = (accion: string) =>
  (ACCIONES_AUDITORIA as Record<string, { etiqueta: string }>)[accion]?.etiqueta ?? accion;
export const etiquetaEntidad = (entidad: string | null) => (entidad ? ENTIDADES_AUDITORIA[entidad] ?? entidad : "—");
export const etiquetaRol = (rol: string | null) => (rol ? ROLES_AUDITORIA[rol] ?? rol : "Sin sesión");

export const AUDITORIA_POR_PAGINA = 20;
export const MAX_DIAS_AUDITORIA = 31;
export const DIAS_AUDITORIA_POR_DEFECTO = 7;

/** Bolivia está siempre en UTC−4 (no tiene horario de verano). */
const DESFASE_BOLIVIA = "-04:00";
const MS_DIA = 86_400_000;

/** Hoy en Bolivia (AAAA-MM-DD). */
export const hoyBolivia = (ahora = Date.now()) => new Date(ahora - 4 * 3_600_000).toISOString().slice(0, 10);
const sumarDias = (dia: string, dias: number) => new Date(Date.parse(`${dia}T00:00:00Z`) + dias * MS_DIA).toISOString().slice(0, 10);
export const diasDelRango = (desde: string, hasta: string) => Math.round((Date.parse(hasta) - Date.parse(desde)) / MS_DIA) + 1;

/** Filtros de la pantalla (ST-70.2). Viven en la URL para volver del detalle sin perder la consulta. */
export interface FiltrosAuditoria {
  /** Días de Bolivia, inclusive los dos. */
  desde: string;
  hasta: string;
  actorId: number | null;
  rol: string | null;
  accion: AccionAuditoria | null;
  entidad: string | null;
  idEntidad: string;
  resultado: ResultadoAuditoria | null;
  correlacion: string;
  orden: OrdenAuditoria;
  pagina: number;
}

export function filtrosAuditoriaPorDefecto(ahora = Date.now()): FiltrosAuditoria {
  const hasta = hoyBolivia(ahora);
  return {
    desde: sumarDias(hasta, -(DIAS_AUDITORIA_POR_DEFECTO - 1)),
    hasta,
    actorId: null,
    rol: null,
    accion: null,
    entidad: null,
    idEntidad: "",
    resultado: null,
    correlacion: "",
    orden: "desc",
    pagina: 1,
  };
}

const esDia = (valor: string | null): valor is string => !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor));
const entero = (valor: string | null) => (valor && /^\d+$/.test(valor) && Number(valor) > 0 ? Number(valor) : null);

/** Lee los filtros de la URL; lo inválido toma el valor por defecto. */
export function leerFiltrosAuditoria(params: URLSearchParams, ahora = Date.now()): FiltrosAuditoria {
  const base = filtrosAuditoriaPorDefecto(ahora);
  const accion = params.get("accion");
  const resultado = params.get("resultado");
  const rol = params.get("rol");
  const entidad = params.get("entidad");
  return {
    desde: esDia(params.get("desde")) ? params.get("desde")! : base.desde,
    hasta: esDia(params.get("hasta")) ? params.get("hasta")! : base.hasta,
    actorId: entero(params.get("actor")),
    rol: rol && rol in ROLES_AUDITORIA ? rol : null,
    accion: accion && accion in ACCIONES_AUDITORIA ? (accion as AccionAuditoria) : null,
    entidad: entidad && entidad in ENTIDADES_AUDITORIA ? entidad : null,
    idEntidad: (params.get("idEntidad") ?? "").trim().slice(0, 64),
    resultado: resultado && resultado in RESULTADOS_AUDITORIA ? (resultado as ResultadoAuditoria) : null,
    correlacion: (params.get("correlacion") ?? "").trim().slice(0, 64),
    orden: params.get("orden") === "asc" ? "asc" : "desc",
    pagina: entero(params.get("pagina")) ?? 1,
  };
}

/** Escribe en la URL solo lo que no es el valor por defecto. */
export function escribirFiltrosAuditoria(filtros: FiltrosAuditoria, actuales: URLSearchParams): URLSearchParams {
  const url = new URLSearchParams(actuales);
  const poner = (clave: string, valor: string | number | null) => {
    if (valor === null || valor === "") url.delete(clave);
    else url.set(clave, String(valor));
  };
  poner("desde", filtros.desde);
  poner("hasta", filtros.hasta);
  poner("actor", filtros.actorId);
  poner("rol", filtros.rol);
  poner("accion", filtros.accion);
  poner("entidad", filtros.entidad);
  poner("idEntidad", filtros.idEntidad);
  poner("resultado", filtros.resultado);
  poner("correlacion", filtros.correlacion);
  poner("orden", filtros.orden === "desc" ? null : filtros.orden);
  poner("pagina", filtros.pagina > 1 ? filtros.pagina : null);
  return url;
}

export type ProblemaFiltrosAuditoria = "rango-invertido" | "rango-largo" | "id-sin-entidad" | "correlacion-invalida";

export const MENSAJE_PROBLEMA_AUDITORIA: Record<ProblemaFiltrosAuditoria, string> = {
  "rango-invertido": "La fecha «Desde» no puede ser posterior a «Hasta».",
  "rango-largo": `El rango no puede pasar de ${MAX_DIAS_AUDITORIA} días. Acórtalo para consultar.`,
  "id-sin-entidad": "Para buscar por ID de entidad, elige primero el tipo de entidad.",
  "correlacion-invalida": "La correlación tiene de 8 a 64 caracteres: letras, números y . _ : -",
};

/** Los mismos controles que hace el back, para no pedir una búsqueda que va a fallar. */
export function problemaFiltrosAuditoria(f: FiltrosAuditoria): ProblemaFiltrosAuditoria | null {
  if (f.desde > f.hasta) return "rango-invertido";
  if (diasDelRango(f.desde, f.hasta) > MAX_DIAS_AUDITORIA) return "rango-largo";
  if (f.idEntidad && !f.entidad) return "id-sin-entidad";
  if (f.correlacion && !/^[A-Za-z0-9._:-]{8,64}$/.test(f.correlacion)) return "correlacion-invalida";
  return null;
}

export const hayFiltrosAuditoria = (f: FiltrosAuditoria) =>
  f.actorId !== null || f.rol !== null || f.accion !== null || f.entidad !== null || !!f.idEntidad || f.resultado !== null || !!f.correlacion;

/**
 * Parámetros del back: los días de Bolivia se convierten a [desde 00:00, día siguiente a «hasta» 00:00)
 * con el desfase −04:00 explícito, como exige el back.
 */
export function paramsAuditoria(f: FiltrosAuditoria): AuditoriaParams {
  return {
    from: `${f.desde}T00:00:00${DESFASE_BOLIVIA}`,
    to: `${sumarDias(f.hasta, 1)}T00:00:00${DESFASE_BOLIVIA}`,
    page: f.pagina,
    limit: AUDITORIA_POR_PAGINA,
    order: f.orden,
    ...(f.actorId !== null ? { actorId: f.actorId } : {}),
    ...(f.rol ? { actorRole: f.rol } : {}),
    ...(f.accion ? { action: f.accion } : {}),
    ...(f.entidad ? { entityType: f.entidad } : {}),
    ...(f.entidad && f.idEntidad ? { entityId: f.idEntidad } : {}),
    ...(f.resultado ? { result: f.resultado } : {}),
    ...(f.correlacion ? { correlationId: f.correlacion } : {}),
  };
}

const formatoHora = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  timeZone: "America/La_Paz",
});

/** Hora de Bolivia con la zona explícita, p. ej. «20/11/2026, 14:05:32 (BOT, UTC−4)». */
export const formatearHoraAuditoria = (iso: string) => `${formatoHora.format(new Date(iso))} (BOT, UTC−4)`;

/** Mensaje para el administrador. Se decide por `status` y `code`, nunca por el texto del back. */
export function mensajeErrorAuditoria(error: ApiError): string {
  if (error.status === 403) return "No tienes permiso para consultar la auditoría. Solo el administrador puede verla.";
  if (error.code === "INVALID_AUDIT_RANGE") return "El rango de fechas no es válido: revisa «Desde» y «Hasta» (máximo 31 días).";
  if (error.code === "INVALID_AUDIT_FILTER") return "Para buscar por ID de entidad, elige primero el tipo de entidad.";
  if (error.kind === "network") return "No pudimos conectarnos con el servidor. Revisa tu conexión e intenta de nuevo.";
  return "No pudimos cargar la auditoría. Intenta de nuevo en un momento.";
}
