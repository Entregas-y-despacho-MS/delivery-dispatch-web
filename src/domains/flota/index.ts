export { vehiculosService } from "./services/vehiculos.service";
export { PanelVehiculosFlota } from "./components/panel-vehiculos-flota";
export { MapaPosicionesFlota } from "./components/mapa-posiciones-flota";
export { usePosicionesFlota } from "./hooks/use-posiciones-flota";
export type { FiltroEstadoFlota, PosicionFlotaEnVivo, UbicacionFlotaActualizada } from "./flota-posiciones.types";
export { esUbicacionSinSenal, filtrarPosicionesFlota } from "./flota-posiciones.types";
export { mantenimientosService } from "./services/mantenimientos.service";
export { useVehiculos } from "./hooks/use-vehiculos";
export { useAccionesMantenimiento, useHistorialMantenimientos } from "./hooks/use-mantenimientos";
export {
  ESTADOS_MANTENIMIENTO,
  ETIQUETA_ESTADO_MANTENIMIENTO,
  ETIQUETA_TIPO_MANTENIMIENTO,
  siguienteEstado,
  type ErrorMantenimiento,
  type FiltrosMantenimiento,
} from "./flota.mantenimiento";
export { VehiculoForm } from "./components/vehiculo-form";
export { CambiarEstadoDialog } from "./components/cambiar-estado-dialog";
export { VehiculosTable } from "./components/vehiculos-table";
export { MantenimientosTable } from "./components/mantenimientos-table";
export { AvanzarMantenimientoDialog } from "./components/avanzar-mantenimiento-dialog";
export { MantenimientoDialog } from "./components/mantenimiento-dialog";
export { MantenimientosFiltros, type VehiculoOpcion } from "./components/mantenimientos-filtros";
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
