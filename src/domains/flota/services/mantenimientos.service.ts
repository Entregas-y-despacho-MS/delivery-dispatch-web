import api from "@/shared/lib/axios";
import type {
  EstadoMantenimiento,
  MantenimientoGuardado,
  MantenimientoListParams,
  MantenimientosResponse,
  RegistrarMantenimientoInput,
} from "../types/flota.types";

const RUTA = "/vehicle-maintenances";

/**
 * Mantenimientos de vehículos (ST-64.1). Supervisor y coordinador.
 * - listar → historial paginado, lo más reciente primero (10 por página, hasta 100).
 * - registrar → alta de una incidencia; si el tipo deja el vehículo fuera de servicio, lo pasa a
 *   mantenimiento. 409 VEHICLE_HAS_ACTIVE_BATCHES si el vehículo tiene lotes confirmados o en ruta.
 * - cambiarEstado → pending → in_progress → completed. Completar devuelve el vehículo a activo
 *   si no le queda otro mantenimiento abierto. 409 INVALID_MAINTENANCE_TRANSITION si se salta un paso.
 */
export const mantenimientosService = {
  listar: async (params: MantenimientoListParams, signal?: AbortSignal) => {
    const { data } = await api.get<MantenimientosResponse>(RUTA, { params, signal, skipErrorToast: true });
    return data;
  },
  registrar: async (input: RegistrarMantenimientoInput) => {
    const cuerpo: RegistrarMantenimientoInput = {
      vehicleId: input.vehicleId,
      vehicleIncidentTypeId: input.vehicleIncidentTypeId,
      description: input.description.trim(),
    };
    const { data } = await api.post<MantenimientoGuardado>(RUTA, cuerpo, { skipErrorToast: true });
    return data;
  },
  cambiarEstado: async (id: number, status: Exclude<EstadoMantenimiento, "pending">) => {
    const { data } = await api.patch<MantenimientoGuardado>(`${RUTA}/${id}/status`, { status }, { skipErrorToast: true });
    return data;
  },
};
