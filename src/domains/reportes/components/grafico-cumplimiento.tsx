import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/shared/lib/utils";
import { cumpleUmbral, etiquetaAgrupacion, formatoMinutos, formatoPorcentaje, nombreGrupo, UMBRAL_SLA_PORCENTAJE } from "../reportes.reglas";
import type { AgrupacionSla, FilaSla, MetricasSla } from "../reportes.types";

/** Barra del % global a tiempo con la marca del umbral pactado. */
export function MedidorCumplimiento({ totales, umbral = UMBRAL_SLA_PORCENTAJE }: { totales: MetricasSla; umbral?: number }) {
  const porcentaje = totales.onTimePercentage;
  const cumple = cumpleUmbral(porcentaje, umbral);
  const sinEntregas = totales.deliveredCount === 0;
  return (
    <figure className="space-y-3 rounded-lg border p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Entregas a tiempo del período</span>
        <span className={cn("text-sm font-semibold", !sinEntregas && (cumple ? "text-success" : "text-destructive"))}>
          {sinEntregas ? "Sin entregas" : cumple ? "Cumple el umbral" : "Por debajo del umbral"}
        </span>
      </figcaption>
      <div
        role="meter"
        aria-label="Porcentaje de entregas a tiempo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        aria-valuetext={`${formatoPorcentaje(porcentaje)}, umbral ${umbral} %`}
        className="relative h-4 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full", cumple ? "bg-success" : "bg-destructive")} style={{ width: `${porcentaje}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${umbral}%` }} aria-hidden />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{formatoPorcentaje(porcentaje)}</span>
        <span>Umbral pactado: {umbral} %</span>
      </div>
    </figure>
  );
}

interface PuntoTiempos {
  nombre: string;
  ciclo: number | null;
  demora: number | null;
}

/** Barras por grupo con ciclo promedio (salida → entrega) y demora promedio de los tardíos. */
export function GraficoTiemposPorGrupo({ filas, agrupacion }: { filas: readonly FilaSla[]; agrupacion: AgrupacionSla }) {
  const datos: PuntoTiempos[] = filas.map((f) => ({ nombre: nombreGrupo(f, agrupacion), ciclo: f.averageCycleMinutes, demora: f.averageDelayMinutes }));
  const alto = Math.max(220, datos.length * 52 + 80);
  return (
    <figure className="space-y-3 rounded-lg border p-4" aria-label={`Tiempos promedio por ${etiquetaAgrupacion(agrupacion).toLowerCase()}`}>
      <figcaption className="text-sm font-medium">
        Tiempos promedio por {etiquetaAgrupacion(agrupacion).toLowerCase()}
        <span className="block text-xs font-normal text-muted-foreground">
          Ciclo: desde la salida a ruta hasta la entrega. Demora: cuánto pasó del fin de la franja, solo en los que llegaron tarde.
        </span>
      </figcaption>
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" unit=" min" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(valor) => formatoMinutos(typeof valor === "number" ? valor : null)} />
            <Legend />
            <Bar dataKey="ciclo" name="Ciclo promedio" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="demora" name="Demora promedio" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
