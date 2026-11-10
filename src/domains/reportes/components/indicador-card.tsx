import { cn } from "@/shared/lib/utils";

interface IndicadorCardProps {
  titulo: string;
  valor: string;
  detalle?: string;
  tono?: "ok" | "alerta";
  tamano?: "normal" | "destacado";
}

/** Tarjeta local de métricas; comparte la misma semántica entre los resúmenes de SLA. */
export function IndicadorCard({ titulo, valor, detalle, tono, tamano = "normal" }: IndicadorCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
      <dd className={cn(
        "mt-1 font-semibold tabular-nums",
        tamano === "destacado" ? "text-3xl" : "text-2xl",
        tono === "ok" && "text-success",
        tono === "alerta" && "text-destructive",
      )}>
        {valor}
      </dd>
      {detalle && <dd className="mt-0.5 text-xs text-muted-foreground">{detalle}</dd>}
    </div>
  );
}
