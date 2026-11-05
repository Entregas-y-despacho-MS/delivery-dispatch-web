export { vehiculosService } from "./services/vehiculos.service";
export { useVehiculos } from "./hooks/use-vehiculos";
export { VehiculoForm } from "./components/vehiculo-form";
export { CambiarEstadoDialog } from "./components/cambiar-estado-dialog";
export { VehiculosTable } from "./components/vehiculos-table";
export { vehiculoSchema, type VehiculoFormValues } from "./flota.schemas";
export type {
  EstadoVehiculo,
  EstadoOperativoVehiculo,
  CambiarEstadoVehiculoInput,
  Vehiculo,
  VehiculoInput,
  VehiculoListParams,
  VehiculoUpdateInput,
} from "./flota.types";
