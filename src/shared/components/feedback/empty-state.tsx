import React from "react";
import { FilterX, Inbox, SearchX } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  bordered?: boolean;
  className?: string;
}

/**
 * Componente genérico para estados vacíos iniciales o informativos.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  bordered = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-14 px-4 text-center",
        bordered && "rounded-lg border border-dashed bg-card/50",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/70 ring-6 ring-muted/20">
        {icon ?? <Inbox className="size-6" aria-hidden />}
      </div>
      <div className="max-w-md space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground text-balance leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export interface NoResultsStateProps {
  /** Título principal (por defecto: "Sin resultados encontrados"). */
  title?: string;
  /** Descripción o mensaje de ayuda (por defecto texto explicativo de filtros). */
  description?: string;
  /** Callback para limpiar y reiniciar todos los filtros aplicados. */
  onClearFilters?: () => void;
  /** Texto del botón de limpieza (por defecto: "Limpiar filtros"). */
  clearButtonText?: string;
  /** Ícono personalizado o null para omitir. */
  icon?: React.ReactNode;
  /** Si debe incluir borde punteado envolvente. */
  bordered?: boolean;
  className?: string;
  /** Acciones adicionales opcionales. */
  extraAction?: React.ReactNode;
}

/**
 * Componente especializado para consultas o tablas sin coincidencias tras aplicar filtros o búsqueda.
 * Ofrece un botón de limpieza rápida en un solo clic.
 */
export function NoResultsState({
  title = "Sin resultados encontrados",
  description = "No encontramos elementos que coincidan con los filtros o términos de búsqueda aplicados.",
  onClearFilters,
  clearButtonText = "Limpiar filtros",
  icon,
  bordered = false,
  className,
  extraAction,
}: NoResultsStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 px-4 text-center animate-in fade-in-50 duration-300",
        bordered && "rounded-lg border border-dashed bg-card/50",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/5 mb-1">
        {icon ?? <SearchX className="size-7" aria-hidden />}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-semibold text-foreground text-base tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed text-balance">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        {onClearFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-2 cursor-pointer border-dashed hover:border-solid hover:bg-accent/80 transition-all font-medium"
          >
            <FilterX className="size-4 text-muted-foreground" aria-hidden />
            {clearButtonText}
          </Button>
        )}
        {extraAction}
      </div>
    </div>
  );
}
