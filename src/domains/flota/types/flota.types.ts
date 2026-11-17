export interface EstadoVehiculo {
  id: number;
  /** Valores reales del catálogo `vehicle_statuses` en el backend (en inglés). */
  name: "active" | "maintenance" | "out_of_service";
}

export type EstadoOperativoVehiculo = EstadoVehiculo["name"];

export type CambiarEstadoVehiculoInput = {
  status: EstadoOperativoVehiculo;
  reason: string;
};

export interface Vehiculo {
  id: number;
  type: string;
  model: string;
  plate: string;
  capacityKg: number;
  capacityM3: number;
  vehicleStatus: EstadoVehiculo;
  createdAt: string;
}

export type VehiculoListParams = {
  page?: number;
  limit?: number;
  search?: string;
  vehicleStatusId?: number;
};

/** Coincide con CreateVehicleDto del backend — el estado no se puede fijar al crear. */
export type VehiculoInput = {
  type: string;
  model: string;
  plate: string;
  capacityKg: number;
  capacityM3: number;
};

/** Coincide con UpdateVehicleDto; el estado se modifica solo por PATCH dedicado con motivo. */
export type VehiculoUpdateInput = Partial<VehiculoInput>;

export interface VehiclesResponse {
  data: Vehiculo[];
  meta: {
    page: number;
    limit: number;
    pages: number;
    total: number;
  };
}

/** Estados de un mantenimiento (`maintenance_status`). Solo avanza: pending → in_progress → completed. */
export type EstadoMantenimiento = "pending" | "in_progress" | "completed";

/** Lo calcula el back: `corrective` si viene de un tipo de incidente, `preventive` si no tiene. */
export type TipoMantenimiento = "preventive" | "corrective";

/** Un registro del historial de mantenimientos (GET /vehicle-maintenances, ST-64.1). */
export interface Mantenimiento {
  id: number;
  vehicleId: number;
  /** El vehículo, aunque después se haya dado de baja: el historial lo conserva. */
  vehicle: { id: number; plate: string; model: string };
  vehicleIncidentTypeId: number | null;
  /** null si no tiene tipo o el tipo se borró del catálogo. */
  vehicleIncidentType: { id: number; code: string; name: string } | null;
  maintenanceType: TipoMantenimiento;
  description: string;
  status: EstadoMantenimiento;
  scheduledAt: string | null;
  /** Fecha de cierre; null hasta que se completa. */
  completedAt: string | null;
  createdAt: string;
}

/** Filtros del historial. `from` y `to` son días de Bolivia (YYYY-MM-DD) sobre la fecha de registro. */
export type MantenimientoListParams = {
  page?: number;
  limit?: number;
  vehicleId?: number;
  status?: EstadoMantenimiento;
  from?: string;
  to?: string;
};

export interface MantenimientosResponse {
  data: Mantenimiento[];
  meta: { page: number; limit: number; pages: number; total: number };
}

/** Cuerpo de POST /vehicle-maintenances: registra una incidencia; siempre empieza en `pending`. */
export interface RegistrarMantenimientoInput {
  vehicleId: number;
  vehicleIncidentTypeId: number;
  description: string;
}

/** Respuesta del POST y del PATCH: el registro y el estado del vehículo justo después del cambio. */
export interface MantenimientoGuardado {
  id: number;
  vehicleId: number;
  vehicleIncidentTypeId: number | null;
  description: string;
  status: EstadoMantenimiento;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  vehicleStatus: EstadoOperativoVehiculo;
}
