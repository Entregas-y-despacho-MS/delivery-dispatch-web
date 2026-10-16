import type { MutationOptions, QueryClient } from "@tanstack/react-query";

import { parseApiError } from "@/shared/lib/api-error";
import { createQueryKeys } from "@/shared/lib/query-keys";
import { mensajeErrorLote, requiereRecargarLote, type AccionLote } from "./planificacion.errores";
import type {
  AprobacionFinal,
  AprobacionPromesas,
  AprobarLoteFinalPayload,
  AprobarPromesasPayload,
  AsignacionVehiculoLote,
  AsignarVehiculoPayload,
  ReasignarRevisorPayload,
  RevisorLote,
} from "./planificacion.types";

/** Caché de los lotes de ruta (lista y detalle). */
export const lotesKeys = createQueryKeys("route-batches");

/**
 * Misma caché que la bandeja de pedidos (scope "pending-orders"). Se declara aquí porque un dominio
 * no importa de otro: aprobar o sacar pedidos cambia lo que muestra la bandeja.
 */
const bandejaKeys = createQueryKeys("pending-orders");

export interface Avisos {
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
}

interface Base {
  queryClient: QueryClient;
  avisar: Avisos;
  /** Se llama cuando el lote que se ve ya no es el vigente (409 de versión, ya no provisional, borrado). */
  alRecargar?: () => void;
}

/** Texto del aviso después de aprobar: cuántos pedidos quedaron y qué pasó con los correos. */
export function mensajeAprobacion({ approvedCount, removedCount, emailResults }: AprobacionPromesas): string {
  const enviados = emailResults.filter((correo) => correo.result === "sent").length;
  const rebotados = emailResults.filter((correo) => correo.result === "bounced").length;
  const fallidos = emailResults.filter((correo) => correo.result === "failed").length;
  const sinCorreo = emailResults.filter((correo) => correo.result === "skipped").length;

  const partes = [`${approvedCount} ${approvedCount === 1 ? "pedido aprobado" : "pedidos aprobados"}`];
  if (removedCount > 0) partes.push(`${removedCount} ${removedCount === 1 ? "devuelto" : "devueltos"} a pendientes`);
  partes.push(`${enviados} ${enviados === 1 ? "correo enviado" : "correos enviados"}`);
  if (rebotados > 0) partes.push(`${rebotados} ${rebotados === 1 ? "rebotó" : "rebotaron"}: hay que contactar al cliente`);
  if (fallidos > 0) partes.push(`${fallidos} sin enviar por un error`);
  if (sinCorreo > 0) partes.push(`${sinCorreo} sin correo registrado`);
  return `Promesas aprobadas: ${partes.join(", ")}.`;
}

function alFallar(base: Base, accion: AccionLote) {
  return (error: unknown) => {
    const apiError = parseApiError(error);
    base.avisar.error(mensajeErrorLote(apiError, accion));
    if (requiereRecargarLote(apiError)) {
      void base.queryClient.invalidateQueries({ queryKey: lotesKeys.all });
      base.alRecargar?.();
    }
  };
}

const recargarTodo = (queryClient: QueryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: lotesKeys.all }),
  queryClient.invalidateQueries({ queryKey: bandejaKeys.all }),
]);

export interface AprobarPromesas {
  loteId: number;
  payload: AprobarPromesasPayload;
}

/**
 * 1.ª aprobación (ST-215.1). Nunca reintenta: ante un 409 avisa, recarga el lote vigente
 * y deja que el coordinador vuelva a revisar antes de aprobar.
 */
export function opcionesAprobarPromesas(base: Base & {
  aprobar: (id: number, payload: AprobarPromesasPayload) => Promise<AprobacionPromesas>;
}): MutationOptions<AprobacionPromesas, unknown, AprobarPromesas> {
  return {
    mutationFn: ({ loteId, payload }) => base.aprobar(loteId, payload),
    onSuccess: (resultado) => base.avisar.exito(mensajeAprobacion(resultado)),
    onError: alFallar(base, "aprobar"),
    onSettled: () => recargarTodo(base.queryClient),
  };
}

export interface CambiarVehiculo {
  loteId: number;
  vehicleId: number;
  /** Versión del lote que se revisó. */
  version: number;
}

export function opcionesAsignarVehiculo(base: Base & {
  asignar: (id: number, payload: AsignarVehiculoPayload) => Promise<AsignacionVehiculoLote>;
}): MutationOptions<AsignacionVehiculoLote, unknown, CambiarVehiculo> {
  return {
    mutationFn: ({ loteId, vehicleId, version }) => base.asignar(loteId, { vehicleId, version }),
    onSuccess: ({ capacity }) => {
      const ocupacion = Math.round(Math.max(capacity.weight.usedPercent, capacity.volume.usedPercent));
      base.avisar.exito(`Vehículo cambiado. La carga ocupa el ${ocupacion} % de su capacidad.`);
    },
    onError: alFallar(base, "vehiculo"),
    onSettled: () => base.queryClient.invalidateQueries({ queryKey: lotesKeys.all }),
  };
}

export interface ReasignarRevisor {
  loteId: number;
  payload: ReasignarRevisorPayload;
  /** Nombre del nuevo revisor, solo para el aviso. */
  nombre: string;
}

export function opcionesReasignarRevisor(base: Base & {
  reasignar: (id: number, payload: ReasignarRevisorPayload) => Promise<RevisorLote>;
}): MutationOptions<RevisorLote, unknown, ReasignarRevisor> {
  return {
    mutationFn: ({ loteId, payload }) => base.reasignar(loteId, payload),
    onSuccess: (_, { nombre }) => base.avisar.exito(`El lote ahora lo revisa ${nombre}.`),
    onError: alFallar(base, "revisor"),
    onSettled: () => base.queryClient.invalidateQueries({ queryKey: lotesKeys.all }),
  };
}

export interface AprobarLoteFinal {
  loteId: number;
  payload: AprobarLoteFinalPayload;
}

/** Texto del aviso después de la 2.ª aprobación. */
export function mensajeAprobacionFinal({ dispatchIds }: AprobacionFinal): string {
  const n = dispatchIds.length;
  return `Lote aprobado: ${n} ${n === 1 ? "pedido asignado" : "pedidos asignados"} al conductor y al vehículo.`;
}

/**
 * 2.ª aprobación (ST-51.1): confirma lote, pedidos, vehículo y conductor juntos.
 * Igual que la 1.ª, nunca reintenta: ante un 409 de versión o de recursos compartidos avisa y recarga.
 */
export function opcionesAprobarLoteFinal(base: Base & {
  aprobar: (id: number, payload: AprobarLoteFinalPayload) => Promise<AprobacionFinal>;
}): MutationOptions<AprobacionFinal, unknown, AprobarLoteFinal> {
  return {
    mutationFn: ({ loteId, payload }) => base.aprobar(loteId, payload),
    onSuccess: (resultado) => base.avisar.exito(mensajeAprobacionFinal(resultado)),
    onError: alFallar(base, "aprobar-final"),
    onSettled: () => recargarTodo(base.queryClient),
  };
}
