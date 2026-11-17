import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { etiquetaResultadoRecepcion, tonoResultadoRecepcion, type TonoRecepcion } from "../recepcion.reglas";

const ESTILO: Record<TonoRecepcion, { clase: string; Icono: typeof CircleCheck }> = {
  ok: { clase: "border-success/40 bg-success/10 text-success", Icono: CircleCheck },
  diferencias: { clase: "border-warning/40 bg-warning/10 text-warning", Icono: TriangleAlert },
  rechazo: { clase: "border-destructive/40 bg-destructive/10 text-destructive", Icono: CircleX },
};

/** «Recibido», «Con diferencias» o «Rechazado», con color e ícono (ST-240.5). */
export function ResultadoRecepcionBadge({ resultado, className }: { resultado: string; className?: string }) {
  const { clase, Icono } = ESTILO[tonoResultadoRecepcion(resultado)];
  return (
    <Badge variant="outline" className={cn("gap-1", clase, className)}>
      <Icono className="size-3.5" aria-hidden />
      {etiquetaResultadoRecepcion(resultado)}
    </Badge>
  );
}
