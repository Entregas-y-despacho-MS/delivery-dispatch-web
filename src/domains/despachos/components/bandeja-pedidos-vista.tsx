import { PackageSearch, RotateCw } from "lucide-react";

import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { TableSkeleton, type SkeletonColumnDef } from "@/shared/components/feedback/table-skeleton";
import { Button } from "@/shared/components/ui/button";
import { BandejaPedidosTable, type BandejaPedidosTableProps } from "./bandeja-pedidos-table";

/** Skeleton con la misma estructura de la tabla real (checkbox + 9 columnas). */
const COLUMNAS_SKELETON: SkeletonColumnDef[] = [
  { header: "", width: "w-4" },
  { header: "N° de orden", type: "subtitle" },
  { header: "Destinatario" },
  { header: "Dirección", type: "subtitle" },
  { header: "Zona" },
  { header: "Franja" },
  { header: "Bultos", type: "number" },
  { header: "Peso (kg)", type: "number" },
  { header: "Volumen (m³)", type: "number" },
  { header: "Prioridad", type: "badge" },
];

interface BandejaPedidosVistaProps extends BandejaPedidosTableProps {
  loading: boolean;
  error?: unknown;
  onReintentar: () => void | Promise<unknown>;
  reintentando?: boolean;
  /** Hay búsqueda o filtros activos: el vacío se explica distinto. */
  filtrada: boolean;
  onLimpiarFiltros: () => void;
}

/** Elige qué mostrar: skeleton, error con reintento, vacío con refresco o la tabla. */
export function BandejaPedidosVista({
  loading,
  error,
  onReintentar,
  reintentando = false,
  filtrada,
  onLimpiarFiltros,
  ...tabla
}: BandejaPedidosVistaProps) {
  if (loading) return <TableSkeleton columns={COLUMNAS_SKELETON} rows={6} />;

  if (error) {
    return (
      <ErrorAlert
        error={error}
        title="No pudimos cargar la bandeja de pedidos"
        onRetry={onReintentar}
        isRetrying={reintentando}
      />
    );
  }

  if (tabla.data.length === 0) {
    const refrescar = (
      <Button type="button" variant="outline" onClick={() => void onReintentar()} disabled={reintentando}>
        <RotateCw className="size-4" aria-hidden /> Actualizar bandeja
      </Button>
    );

    return filtrada ? (
      <NoResultsState
        title="Ningún pedido coincide"
        description="Prueba con otro destinatario, código de guía, zona o turno."
        onClearFilters={onLimpiarFiltros}
        extraAction={refrescar}
        bordered
      />
    ) : (
      <EmptyState
        icon={<PackageSearch className="size-6" aria-hidden />}
        title="No hay pedidos pendientes de planificación"
        description="Cuando lleguen pedidos listos para despacho aparecerán aquí. Actualiza para revisar si entraron nuevos."
        action={refrescar}
      />
    );
  }

  return <BandejaPedidosTable {...tabla} />;
}
