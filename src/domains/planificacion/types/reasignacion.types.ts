export interface DestinoReasignacion {
  routeBatchId: number;
  version: number;
  driverId: number;
  driverFullName: string;
  vehicleId: number;
  vehiclePlate: string;
  zoneId: number | null;
  zoneName: string | null;
  remainingWeightKg: number;
  remainingVolumeM3: number;
}

export interface ReasignarParadasPayload {
  dispatchIds: number[];
  targetBatchId: number;
  reasonCode: string;
  version: number;
  targetVersion: number;
}
