import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { TableSkeleton } from "@/shared/components/feedback/table-skeleton";
import { cn } from "@/shared/lib/utils";

export interface Column<T> {
  header: string;
  /** Clave del objeto o función de render. */
  cell: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  /** Cantidad de filas a renderizar en el skeleton (por defecto: 5). */
  skeletonRows?: number;
  /** Título del estado vacío. */
  emptyTitle?: string;
  /** Mensaje explicativo del estado vacío. */
  emptyMessage?: string;
  /** Indica si la lista vacía se debe a filtros o búsquedas activas. */
  isFiltered?: boolean;
  /** Callback para limpiar filtros cuando no hay resultados. */
  onClearFilters?: () => void;
  /** Error opcional para renderizar alerta de fallo. */
  error?: unknown;
  /** Callback de reintento ante errores. */
  onRetry?: () => void | Promise<unknown>;
  /** Si debe reintentar automáticamente (segundos o booleano). */
  autoRetry?: boolean | number;
  className?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading,
  skeletonRows = 5,
  emptyTitle,
  emptyMessage = "No hay registros todavía.",
  isFiltered = false,
  onClearFilters,
  error,
  onRetry,
  autoRetry,
  className,
}: DataTableProps<T>) {
  // Manejo de error si existe
  if (error && !loading) {
    return (
      <ErrorAlert
        error={error}
        onRetry={onRetry}
        autoRetry={autoRetry}
        className={className}
      />
    );
  }

  // Carga anatómica reflejando las columnas reales de la tabla
  if (loading) {
    const skeletonCols = columns.map((col) => ({
      header: col.header,
      className: col.className,
    }));

    return (
      <TableSkeleton
        columns={skeletonCols}
        rows={skeletonRows}
        className={className}
      />
    );
  }

  // Estado vacío: diferencia entre búsqueda filtrada sin resultados y tabla completamente vacía
  if (!data.length) {
    if (isFiltered) {
      return (
        <NoResultsState
          title={emptyTitle ?? "Sin resultados encontrados"}
          description={emptyMessage}
          onClearFilters={onClearFilters}
          bordered
          className={className}
        />
      );
    }

    return (
      <EmptyState
        title={emptyTitle ?? "Sin resultados"}
        description={emptyMessage}
        className={className}
      />
    );
  }

  // Tabla poblada
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden shadow-xs", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.header} className={cn("font-semibold text-foreground/80", col.className)}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
              {columns.map((col) => (
                <TableCell key={col.header} className={cn(col.className)}>
                  {typeof col.cell === "function"
                    ? col.cell(row)
                    : (row[col.cell] as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
