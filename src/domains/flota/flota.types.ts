export interface EstadoVehiculo {
  id: number;
  /** Valores reales del catálogo `vehicle_statuses` en el backend (en inglés). */
  name: "active" | "maintenance" | "out_of_service";
}

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

/** Coincide con UpdateVehicleDto — todos los campos opcionales. */
export type VehiculoUpdateInput = Partial<VehiculoInput> & {
  vehicleStatusId?: number;
};

export interface VehiclesResponse {
  data: Vehiculo[];
  meta: {
    page: number;
    limit: number;
    pages: number;
    total: number;
  };
}
