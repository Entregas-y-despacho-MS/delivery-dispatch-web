import { AlertTriangle, Info } from "lucide-react";

import { cn } from "cn";
import {
  formatearKilos,
  formatearMetrosCubicos,
  formatearPorcentaje,
  nivelOcupacion,
  type NivelOcupacion,
} from "../planificacion.format";
import type { MedidaCapacidad, ReporteCapacidad } from "../planificacion.types";

const COLOR_BARRA: Record<NivelOcupacion, string> = {
  normal: "bg-success",
  alta: "bg-warning",
  excedida: "bg-destructive",
};

const COLOR_TEXTO: Record<NivelOcupacion, string> = {
  normal: "text-muted-foreground",
  alta: "text-warning",
  excedida: "text-destructive",
};

interface BarraOcupacionProps {
  etiqueta: string;
  /** Porcentaje usado; puede pasar de 100 si la carga no entra. */
  porcentaje: number;
  /** Detalle a la derecha, p. ej. «820 kg de 1000 kg». */
  detalle?: string;
  className?: string;
}

/** Barra de ocupación del vehículo: verde, ámbar desde el 90 % y roja si se pasa de la capacidad. */
export function BarraOcupacion({ etiqueta, porcentaje, detalle, className }: BarraOcupacionProps) {
  const nivel = nivelOcupacion(porcentaje);
  const ancho = Math.min(100, Math.max(0, porcentaje));

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{etiqueta}</span>
        <span className={cn("tabular-nums", COLOR_TEXTO[nivel])}>
          {formatearPorcentaje(porcentaje)}
          {detalle && <span className="text-muted-foreground"> · {detalle}</span>}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label={`Ocupación de ${etiqueta.toLowerCase()}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(porcentaje)}
      >
        <div className={cn("h-full rounded-full transition-[width]", COLOR_BARRA[nivel])} style={{ width: `${ancho}%` }} />
      </div>
    </div>
  );
}

const detalle = (medida: MedidaCapacidad, formato: (valor: number) => string) =>
  `${formato(medida.actual)} de ${formato(medida.capacity)}`;

/**
 * Ocupación completa del lote con el reporte de capacidad del back: peso, volumen,
 * pedidos con peso estimado y bultos que no caben por sus medidas.
 */
export function OcupacionLote({ capacidad }: { capacidad: ReporteCapacidad }) {
  const estimados = capacidad.estimatedDispatchIds.length;
  const fueraDeMedida = capacidad.dimensionViolations.length;

  return (
    <div className="space-y-3">
      <BarraOcupacion etiqueta="Peso" porcentaje={capacidad.weight.usedPercent} detalle={detalle(capacidad.weight, formatearKilos)} />
      <BarraOcupacion etiqueta="Volumen" porcentaje={capacidad.volume.usedPercent} detalle={detalle(capacidad.volume, formatearMetrosCubicos)} />

      {!capacidad.assignable && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          La carga no entra en este vehículo
          {fueraDeMedida > 0 && ` (${fueraDeMedida} ${fueraDeMedida === 1 ? "bulto excede" : "bultos exceden"} sus medidas)`}.
        </p>
      )}
      {estimados > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {estimados === 1 ? "1 pedido no tiene bultos registrados: su peso es estimado." : `${estimados} pedidos no tienen bultos registrados: su peso es estimado.`}
        </p>
      )}
    </div>
  );
}
