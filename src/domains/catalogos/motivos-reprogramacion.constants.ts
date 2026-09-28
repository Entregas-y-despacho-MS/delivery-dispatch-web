import type { MotivoReprogramacionCategoria } from "./catalogos.types";

export const MOTIVO_REPROGRAMACION_CATEGORIAS: {
  value: MotivoReprogramacionCategoria;
  label: string;
  badgeClassName: string;
}[] = [
  {
    value: "client",
    label: "Cliente",
    badgeClassName: "border-info/20 bg-info/10 text-info",
  },
  {
    value: "operations",
    label: "Operación",
    badgeClassName: "border-warning/20 bg-warning/10 text-warning",
  },
  {
    value: "force_majeure",
    label: "Fuerza mayor",
    badgeClassName: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
];

export function getMotivoReprogramacionCategoria(category: MotivoReprogramacionCategoria) {
  return MOTIVO_REPROGRAMACION_CATEGORIAS.find((item) => item.value === category)!;
}
