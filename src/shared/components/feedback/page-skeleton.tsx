import { Skeleton } from "@/shared/components/ui/skeleton";

/** Mantiene la estructura del panel mientras se descarga una página. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Cargando página" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
