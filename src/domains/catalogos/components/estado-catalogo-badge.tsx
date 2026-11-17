import { Power } from "lucide-react";

import { StatusBadge } from "@/shared/components/common/status-badge";

/** Presentación común del estado activo/inactivo de los catálogos. */
export function EstadoCatalogoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <StatusBadge tone="success" icon={<Power aria-hidden />}>Activo</StatusBadge>
  ) : (
    <StatusBadge tone="muted">Inactivo</StatusBadge>
  );
}
