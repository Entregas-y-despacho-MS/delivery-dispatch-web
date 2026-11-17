import { History } from "lucide-react";

import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { TableSkeleton, type SkeletonColumnDef } from "@/shared/components/feedback/table-skeleton";
import { HistorialDespachosTabla, type HistorialDespachosTablaProps } from "./historial-despachos-tabla";

const COLUMNAS_SKELETON: SkeletonColumnDef[] = [
  { header: "Código" },
  { header: "Cliente" },
  { header: "Repartidor" },
  { header: "Vehículo" },
  { header: "Partida", type: "subtitle" },
  { header: "Entrega", type: "subtitle" },
  { header: "Estado final", type: "badge" },
  { header: "Cierre", type: "subtitle" },
];

interface HistorialDespachosVistaProps extends HistorialDespachosTablaProps {
  cargando: boolean;
  error?: unknown;
  onReintentar: () => void | Promise<unknown>;
  reintentando?: boolean;
  /** Hay filtros activos: el vacío se explica distinto. */
  filtrada: boolean;
  onLimpiarFiltros: () => void;
}

/** Skeleton, error con reintento, vacío o la tabla. */
export function HistorialDespachosVista({ cargando, error, onReintentar, reintentando = false, filtrada, onLimpiarFiltros, ...tabla }: HistorialDespachosVistaProps) {
  if (cargando) return <TableSkeleton columns={COLUMNAS_SKELETON} rows={6} />;

  if (error) {
    return <ErrorAlert error={error} title="No pudimos cargar el historial" onRetry={onReintentar} isRetrying={reintentando} />;
  }

  if (tabla.data.length === 0) {
    return filtrada ? (
      <NoResultsState
        title="Ningún despacho coincide"
        description="Prueba con otro rango de fechas, repartidor, vehículo, estado o código."
        onClearFilters={onLimpiarFiltros}
        bordered
      />
    ) : (
      <EmptyState
        icon={<History className="size-6" aria-hidden />}
        title="Todavía no hay despachos finalizados"
        description="Cuando un despacho se entregue, se devuelva o se cancele, aparecerá aquí."
      />
    );
  }

  return <HistorialDespachosTabla {...tabla} />;
}
