import { Skeleton } from "@/shared/components/ui/skeleton";

interface CardSkeletonListProps {
  count?: number;
  variant?: "default" | "incident";
}

/** Tarjetas de carga para las listas móviles de catálogos y flota. */
export function CardSkeletonList({ count = 3, variant = "default" }: CardSkeletonListProps) {
  const lines = variant === "incident"
    ? ["h-4 w-28", "h-5 w-3/4", "h-6 w-1/2"]
    : ["h-5 w-2/3", "h-4 w-1/2", "h-9 w-full"];

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4" aria-hidden="true">
          {lines.map((line, lineIndex) => <Skeleton key={lineIndex} className={line} />)}
        </div>
      ))}
    </>
  );
}
