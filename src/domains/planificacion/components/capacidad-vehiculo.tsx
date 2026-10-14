import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { formatearMedida, type Capacidad } from "../planificacion.capacidad";

const ETIQUETA = { peso: "Peso", volumen: "Volumen" } as const;

const ESTILO = {
  normal: { barra: "bg-success", texto: "text-muted-foreground" },
  alta: { barra: "bg-warning", texto: "text-warning" },
  excedida: { barra: "bg-destructive", texto: "text-destructive" },
  "sin-capacidad": { barra: "bg-muted-foreground/40", texto: "text-muted-foreground" },
} as const;

/**
 * Barra de llenado de un lote frente a la capacidad del vehículo (ST-51.1).
 * Verde hasta el 90 %, ámbar hasta el 100 % y roja si se pasa, con el exceso exacto.
 */
export function BarraCapacidad({ capacidad }: { capacidad: Capacidad }) {
  const { medida, usado, porcentaje, exceso, estado } = capacidad;
  const estilo = ESTILO[estado];
  const ancho = Math.min(porcentaje ?? 0, 100);
  const total = capacidad.capacidad === null ? "sin capacidad registrada" : `${formatearMedida(medida, usado)} de ${formatearMedida(medida, capacidad.capacidad)}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{ETIQUETA[medida]}</span>
        <span className="tabular-nums text-muted-foreground">
          {capacidad.capacidad === null
            ? formatearMedida(medida, usado)
            : `${formatearMedida(medida, usado)} / ${formatearMedida(medida, capacidad.capacidad)} · ${porcentaje} %`}
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${ETIQUETA[medida]} del lote: ${total}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje ?? undefined}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full transition-all", estilo.barra)} style={{ width: `${ancho}%` }} />
      </div>
      {estado === "excedida" && (
        <p className={cn("flex items-center gap-1.5 text-xs font-medium", estilo.texto)} role="alert">
          <CircleAlert className="size-3.5" aria-hidden /> Excede por {formatearMedida(medida, exceso)}
        </p>
      )}
      {estado === "alta" && (
        <p className={cn("flex items-center gap-1.5 text-xs", estilo.texto)}>
          <AlertTriangle className="size-3.5" aria-hidden /> Cerca del límite
        </p>
      )}
      {estado === "normal" && (
        <p className={cn("flex items-center gap-1.5 text-xs", estilo.texto)}>
          <CheckCircle2 className="size-3.5 text-success" aria-hidden /> Dentro de la capacidad
        </p>
      )}
      {estado === "sin-capacidad" && (
        <p className={cn("text-xs", estilo.texto)}>El vehículo no tiene esta capacidad registrada.</p>
      )}
    </div>
  );
}
