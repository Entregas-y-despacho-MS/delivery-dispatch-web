import type { ApiError } from "@/shared/lib/api-error";
import { leerFiltrosSla, problemaRango, type ProblemaRango } from "./reportes.reglas";

/*
 * Desempeño de proveedores en recojos (ST-305.2) sobre GET /reports/supplier-pickups (ST-305.1). Cumplimiento =
 * recogidos hasta el fin de la ventana / citas vencidas con resultado. Cada recojo cae en una sola categoría.
 */

export type CategoriaCita = "onTime" | "late" | "failed" | "openOverdue" | "pendingNotDue" | "cancelled" | "noValidAppointment" | "unknownTiming";

export interface VentanaCita {
  start: string;
  end: string;
}

export interface ExcepcionRecojo {
  dispatchId: number;
  category: "failed" | "openOverdue" | "late" | "unknownTiming";
  status: string;
  purchaseOrderRef: string;
  supplier: { id: string; name: string | null } | null;
  destinationWarehouseId: number | null;
  window: VentanaCita | null;
  originalWindow: VentanaCita | null;
  rescheduledAt: string | null;
  custodyReceivedAt: string | null;
  arrivedAtWarehouseAt: string | null;
}

export interface CumplimientoProveedores {
  from: string;
  to: string;
  dateBasis: "appointment_window_end";
  timeZone: string;
  asOf: string;
  filters: { supplierId: string | null; warehouseId: number | null; zoneId: number | null; status: string | null };
  metrics: { numerator: number; denominator: number; n: number; percentage: number | null; unavailableReason: string | null };
  counts: Record<CategoriaCita, number>;
  rescheduledCount: number;
  originalExpiredBeforeRescheduleCount: number;
  exceptionsTotal: number;
  exceptions: ExcepcionRecojo[];
  empty: boolean;
}

export type ParamsProveedores = {
  from: string;
  to: string;
  exceptionLimit: number;
  supplierId?: string;
  warehouseId?: number;
  status?: string;
};

/** El back devuelve hasta 100 excepciones; en pantalla se paginan de a 10. */
export const LIMITE_EXCEPCIONES = 100;
export const EXCEPCIONES_POR_PAGINA = 10;
export const ND = "N/D";

export const CATEGORIAS: Record<CategoriaCita, { etiqueta: string; enTasa: boolean }> = {
  onTime: { etiqueta: "A tiempo", enTasa: true },
  late: { etiqueta: "Tarde", enTasa: true },
  failed: { etiqueta: "Fallidos", enTasa: true },
  openOverdue: { etiqueta: "Vencidos sin resultado", enTasa: false },
  pendingNotDue: { etiqueta: "Pendientes (cita por venir)", enTasa: false },
  cancelled: { etiqueta: "Cancelados", enTasa: false },
  noValidAppointment: { etiqueta: "Sin cita válida", enTasa: false },
  unknownTiming: { etiqueta: "Hora de recojo desconocida", enTasa: false },
};

export const CODIGOS_CATEGORIA = Object.keys(CATEGORIAS) as CategoriaCita[];

export const CAUSAS_ND_PROVEEDORES: Record<string, string> = {
  missing_timestamp: "Los recojos vencidos dicen que se recogieron pero no tienen la hora de custodia.",
  no_valid_results: "Todavía no hay citas vencidas con resultado en el período.",
};

export const ESTADOS_RECOJO: Record<string, string> = {
  pickup_scheduled: "Recojo programado",
  picked_up_in_transit: "Recogido, en camino",
  delivered: "Entregado en almacén",
  incident: "Con incidencia",
  not_delivered: "No recogido",
  cancelled: "Cancelado",
};

/** Volumen: todos los recojos del período, en cualquier categoría. */
export const volumenRecojos = (counts: Record<CategoriaCita, number>) => CODIGOS_CATEGORIA.reduce((suma, c) => suma + (counts[c] ?? 0), 0);

const decimal = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 });
export const textoCumplimiento = (m: CumplimientoProveedores["metrics"]) => (m.percentage === null ? ND : `${decimal.format(m.percentage)} %`);

const fechaHora = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/La_Paz" });
export const formatearMomento = (valor: string | null) => (valor ? fechaHora.format(new Date(valor)) : "—");
export const formatearVentana = (v: VentanaCita | null) => (v ? `${formatearMomento(v.start)} – ${formatearMomento(v.end)}` : "Sin ventana");

export const nombreProveedor = (e: Pick<ExcepcionRecojo, "supplier">) => e.supplier?.name ?? e.supplier?.id ?? "Proveedor sin registrar";

/** Excepciones agrupadas por proveedor y por almacén destino (solo lo que vino en la lista). */
export function excepcionesPorGrupo(excepciones: ExcepcionRecojo[], clave: (e: ExcepcionRecojo) => string) {
  const grupos = new Map<string, number>();
  for (const e of excepciones) grupos.set(clave(e), (grupos.get(clave(e)) ?? 0) + 1);
  return [...grupos.entries()].map(([grupo, cantidad]) => ({ grupo, cantidad })).sort((a, b) => b.cantidad - a.cantidad || a.grupo.localeCompare(b.grupo));
}

/* ── Filtros en la URL; el período es el `desde`/`hasta` compartido ── */

export interface FiltrosProveedores {
  desde: string;
  hasta: string;
  proveedor: string;
  almacen: number | null;
  estado: string | null;
  pagina: number;
}

const entero = (valor: string | null) => (valor && /^\d+$/.test(valor) && Number(valor) > 0 ? Number(valor) : null);

export function leerFiltrosProveedores(url: URLSearchParams, ahora = new Date()): FiltrosProveedores {
  const { desde, hasta } = leerFiltrosSla(url, ahora);
  const estado = url.get("estadoRecojo");
  return {
    desde,
    hasta,
    proveedor: (url.get("proveedor") ?? "").slice(0, 64),
    almacen: entero(url.get("almacen")),
    estado: estado && estado in ESTADOS_RECOJO ? estado : null,
    pagina: entero(url.get("paginaProveedores")) ?? 1,
  };
}

export function escribirFiltrosProveedores(f: FiltrosProveedores, base: URLSearchParams): URLSearchParams {
  const url = new URLSearchParams(base);
  const poner = (clave: string, valor: string | number | null) => {
    if (valor === null || valor === "") url.delete(clave);
    else url.set(clave, String(valor));
  };
  poner("proveedor", f.proveedor.trim());
  poner("almacen", f.almacen);
  poner("estadoRecojo", f.estado);
  poner("paginaProveedores", f.pagina > 1 ? f.pagina : null);
  return url;
}

export const hayFiltrosProveedores = (f: FiltrosProveedores) => Boolean(f.proveedor.trim() || f.almacen || f.estado);
export const problemaProveedores = (f: FiltrosProveedores): ProblemaRango | null => problemaRango(f);

export function paramsProveedores(f: FiltrosProveedores): ParamsProveedores {
  const params: ParamsProveedores = { from: f.desde, to: f.hasta, exceptionLimit: LIMITE_EXCEPCIONES };
  if (f.proveedor.trim()) params.supplierId = f.proveedor.trim();
  if (f.almacen) params.warehouseId = f.almacen;
  if (f.estado) params.status = f.estado;
  return params;
}

export function mensajeErrorProveedores(error: ApiError): string {
  if (error.status === 403) return "Solo el coordinador puede ver el desempeño de los proveedores.";
  if (error.kind === "validation") return "Revisa el período: no puede pasar de 366 días.";
  if (error.kind === "network") return "No pudimos conectarnos con el servidor. Revisa tu conexión.";
  return "No pudimos cargar el desempeño de los proveedores. Intenta de nuevo.";
}
