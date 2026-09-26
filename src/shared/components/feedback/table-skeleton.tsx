import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

export type SkeletonCellType = "text" | "subtitle" | "badge" | "actions" | "avatar" | "number";

export interface SkeletonColumnDef {
  header?: string;
  className?: string;
  type?: SkeletonCellType;
  width?: string;
}

export interface TableSkeletonProps {
  /** Cantidad de columnas o array con definiciones/nombres de columnas. */
  columns?: number | (string | SkeletonColumnDef)[];
  /** Cantidad de filas simuladas (por defecto: 5). */
  rows?: number;
  /** Si debe incluir la cabecera (por defecto: true). */
  showHeader?: boolean;
  className?: string;
}

export interface TableSkeletonRowsProps {
  /** Cantidad de columnas o array con definiciones/nombres de columnas. */
  columns?: number | (string | SkeletonColumnDef)[];
  /** Cantidad de filas simuladas (por defecto: 5). */
  rows?: number;
}

const DEFAULT_CELL_WIDTHS = ["w-32", "w-40", "w-24", "w-20", "w-28"];

function normalizeColumns(columns: number | (string | SkeletonColumnDef)[] = 5): SkeletonColumnDef[] {
  if (typeof columns === "number") {
    return Array.from({ length: columns }).map((_, index) => {
      // Por defecto la última columna se trata como acciones si hay 4 o más columnas
      const isLast = index === columns - 1;
      const isBadge = index === columns - 2 && columns >= 4;
      return {
        type: isLast && columns >= 3 ? "actions" : isBadge ? "badge" : index === 0 ? "subtitle" : "text",
        className: isLast ? "text-right pr-4 w-24" : undefined,
      };
    });
  }

  return columns.map((col, index) => {
    if (typeof col === "string") {
      const isLast = index === columns.length - 1;
      return {
        header: col,
        type: isLast && columns.length >= 3 ? "actions" : index === 0 ? "subtitle" : "text",
        className: isLast ? "text-right pr-4 w-24" : undefined,
      };
    }
    return col;
  });
}

function renderCellSkeleton(colDef: SkeletonColumnDef, rowIndex: number, colIndex: number) {
  const type = colDef.type ?? (colIndex === 0 ? "subtitle" : "text");

  switch (type) {
    case "subtitle":
      return (
        <div className="space-y-1.5 py-0.5">
          <Skeleton className={cn("h-4", colDef.width ?? "w-28 sm:w-36")} />
          <Skeleton className="h-3 w-16 sm:w-24 opacity-70" />
        </div>
      );
    case "badge":
      return <Skeleton className={cn("h-5 w-16 rounded-full", colDef.width)} />;
    case "actions":
      return (
        <div className="flex justify-end gap-1.5">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      );
    case "number":
      return <Skeleton className={cn("h-4 w-14 tabular-nums", colDef.width)} />;
    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16 opacity-70" />
          </div>
        </div>
      );
    case "text":
    default: {
      const fallbackWidth = DEFAULT_CELL_WIDTHS[(rowIndex + colIndex) % DEFAULT_CELL_WIDTHS.length];
      return <Skeleton className={cn("h-4", colDef.width ?? fallbackWidth)} />;
    }
  }
}

/**
 * Renderiza exclusivamente filas <TableRow> con skeletons anatómicos.
 * Ideal para ser insertado dentro de un <TableBody> ya existente con su propio <TableHeader>.
 */
export function TableSkeletonRows({
  columns = 5,
  rows = 5,
}: TableSkeletonRowsProps) {
  const cols = normalizeColumns(columns);

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`} className="hover:bg-transparent">
          {cols.map((col, colIndex) => (
            <TableCell
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              className={cn("py-3.5", col.className)}
            >
              {renderCellSkeleton(col, rowIndex, colIndex)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * Componente completo de carga tipo Skeleton para tablas.
 * Refleja la anatomía completa de cabecera y filas según el número de columnas o estructura dada.
 */
export function TableSkeleton({
  columns = 5,
  rows = 5,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  const cols = normalizeColumns(columns);

  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden shadow-xs", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {cols.map((col, i) => (
                <TableHead key={`skeleton-head-${i}`} className={cn("py-3", col.className)}>
                  {col.header ? (
                    <span className="font-semibold text-foreground/80">{col.header}</span>
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          <TableSkeletonRows columns={cols} rows={rows} />
        </TableBody>
      </Table>
    </div>
  );
}
