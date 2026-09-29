import type { SeveridadIncidenteVehiculo } from "./catalogos.types";

const SEVERIDAD_CONFIG: Record<SeveridadIncidenteVehiculo, {
  value: SeveridadIncidenteVehiculo;
  label: string;
  badgeClassName: string;
}> = {
  minor: { value: "minor", label: "Leve", badgeClassName: "border-success/20 bg-success/10 text-success" },
  moderate: { value: "moderate", label: "Moderada", badgeClassName: "border-warning/20 bg-warning/10 text-warning" },
  critical: { value: "critical", label: "Crítica", badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive" },
};

export const SEVERIDADES_INCIDENTE_VEHICULO = Object.values(SEVERIDAD_CONFIG);

export function getSeveridadIncidenteVehiculo(value: SeveridadIncidenteVehiculo) {
  return SEVERIDAD_CONFIG[value];
}
