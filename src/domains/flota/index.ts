export { vehiculosService } from "./services/vehiculos.service";
export { mantenimientosService } from "./services/mantenimientos.service";
export { useVehiculos } from "./hooks/use-vehiculos";
export { VehiculoForm } from "./components/vehiculo-form";
export { CambiarEstadoDialog } from "./components/cambiar-estado-dialog";
export { VehiculosTable } from "./components/vehiculos-table";
export { vehiculoSchema, type VehiculoFormValues } from "./flota.schemas";
export type {
  EstadoVehiculo,
  EstadoOperativoVehiculo,
  EstadoMantenimiento,
  Mantenimiento,
  MantenimientoGuardado,
  MantenimientoListParams,
  RegistrarMantenimientoInput,
  TipoMantenimiento,
  CambiarEstadoVehiculoInput,
  Vehiculo,
  VehiculoInput,
  VehiculoListParams,
  VehiculoUpdateInput,
} from "./flota.types";
