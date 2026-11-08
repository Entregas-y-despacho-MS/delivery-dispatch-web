import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  direccionInicial,
  nombreRepartidor,
  nombreVehiculo,
  ordenarRanking,
  PERIODOS_KPI,
  type ColumnaRanking,
  type DireccionOrden,
} from "../reportes.kpis";
import { cumpleUmbral, formatoPorcentaje, UMBRAL_SLA_PORCENTAJE } from "../reportes.reglas";
import type { FilaSla, MetricasSla, PeriodoKpi } from "../reportes.types";

/** Hoy, esta semana o este mes. */
export function SelectorPeriodoKpi({ periodo, onCambiar, deshabilitado }: {
  periodo: PeriodoKpi;
  onCambiar: (periodo: PeriodoKpi) => void;
  deshabilitado?: boolean;
}) {
  return (
    <div role="group" aria-label="Período" className="inline-flex rounded-lg border bg-muted/40 p-1">
      {PERIODOS_KPI.map(({ valor, etiqueta }) => (
        <Button
          key={valor}
          type="button"
          size="sm"
          variant={periodo === valor ? "default" : "ghost"}
          aria-pressed={periodo === valor}
          disabled={deshabilitado}
          onClick={() => onCambiar(valor)}
        >
          {etiqueta}
        </Button>
      ))}
    </div>
  );
}

function Tarjeta({ titulo, valor, detalle, tono }: { titulo: string; valor: string; detalle?: string; tono?: "ok" | "alerta" }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
      <dd className={cn("mt-1 text-3xl font-semibold tabular-nums", tono === "ok" && "text-success", tono === "alerta" && "text-destructive")}>
        {valor}
      </dd>
      {detalle && <dd className="mt-0.5 text-xs text-muted-foreground">{detalle}</dd>}
    </div>
  );
}

/** Tarjetas del período (escenario 1 de ES-61): % a tiempo, entregas cerradas e incidencias. */
export function TarjetasKpi({ totales }: { totales: MetricasSla }) {
  const sinEntregas = totales.deliveredCount === 0;
  return (
    <dl className="grid gap-3 sm:grid-cols-3" aria-label="Indicadores del período">
      <Tarjeta
        titulo="Entregas a tiempo"
        valor={formatoPorcentaje(totales.onTimePercentage)}
        detalle={`${totales.onTimeCount} de ${totales.deliveredCount} entregados · umbral ${UMBRAL_SLA_PORCENTAJE} %`}
        tono={sinEntregas ? undefined : cumpleUmbral(totales.onTimePercentage) ? "ok" : "alerta"}
      />
      <Tarjeta
        titulo="Entregas cerradas"
        valor={String(totales.closedCount)}
        detalle={`${totales.deliveredCount} entregados · ${totales.lateCount} con demora`}
      />
      <Tarjeta titulo="Incidencias" valor={String(totales.incidentCount)} detalle="Registradas en los despachos del período" />
    </dl>
  );
}

const COLUMNAS: { columna: ColumnaRanking; titulo: string; numerica: boolean }[] = [
  { columna: "nombre", titulo: "Repartidor", numerica: false },
  { columna: "cerrados", titulo: "Cerrados", numerica: true },
  { columna: "aTiempo", titulo: "% a tiempo", numerica: true },
  { columna: "incidencias", titulo: "Incidencias", numerica: true },
];

/**
 * Ranking de repartidores (escenario 1 de ES-61): tabla ordenable por cualquier columna. Empieza por
 * % a tiempo de mayor a menor; un segundo clic en la misma columna invierte el orden.
 */
export function RankingRepartidores({ filas }: { filas: readonly FilaSla[] }) {
  const [orden, setOrden] = useState<{ columna: ColumnaRanking; direccion: DireccionOrden }>({ columna: "aTiempo", direccion: "desc" });
  const ordenadas = ordenarRanking(filas, orden.columna, orden.direccion);
  const ordenarPor = (columna: ColumnaRanking) =>
    setOrden((actual) => actual.columna === columna
      ? { columna, direccion: actual.direccion === "asc" ? "desc" : "asc" }
      : { columna, direccion: direccionInicial(columna) });

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby="ranking-titulo">
      <h2 id="ranking-titulo" className="text-sm font-medium">Ranking de repartidores</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              {COLUMNAS.map(({ columna, titulo, numerica }) => {
                const activa = orden.columna === columna;
                const Icono = !activa ? ArrowUpDown : orden.direccion === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={columna}
                    scope="col"
                    aria-sort={activa ? (orden.direccion === "asc" ? "ascending" : "descending") : "none"}
                    className={cn("py-2 font-medium", numerica ? "text-right" : "text-left")}
                  >
                    <button
                      type="button"
                      onClick={() => ordenarPor(columna)}
                      className={cn("inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activa && "text-foreground")}
                    >
                      {titulo}
                      <Icono className="size-3.5" aria-hidden />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((fila, indice) => {
              const sinEntregas = fila.deliveredCount === 0;
              return (
                <tr key={fila.groupId ?? "sin-repartidor"} className="border-b last:border-0">
                  <td className="py-2">
                    <span className="mr-2 inline-block w-5 text-right text-xs text-muted-foreground tabular-nums">
                      {fila.groupName === null ? "" : `${indice + 1}.`}
                    </span>
                    <span className={cn("font-medium", fila.groupName === null && "text-muted-foreground")}>{nombreRepartidor(fila)}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{fila.closedCount}</td>
                  <td className={cn(
                    "py-2 text-right font-medium tabular-nums",
                    !sinEntregas && (cumpleUmbral(fila.onTimePercentage) ? "text-success" : "text-destructive"),
                  )}>
                    {sinEntregas ? "—" : formatoPorcentaje(fila.onTimePercentage)}
                  </td>
                  <td className={cn("py-2 text-right tabular-nums", fila.incidentCount > 0 && "font-medium text-warning")}>{fila.incidentCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface PuntoVehiculo {
  nombre: string;
  porcentaje: number;
  entregados: number;
  cumple: boolean;
}

/** Barras de % a tiempo por vehículo (placa), con la línea del umbral pactado. */
export function BarrasPorVehiculo({ filas }: { filas: readonly FilaSla[] }) {
  const datos: PuntoVehiculo[] = filas.map((fila) => ({
    nombre: nombreVehiculo(fila),
    porcentaje: fila.onTimePercentage,
    entregados: fila.deliveredCount,
    cumple: cumpleUmbral(fila.onTimePercentage),
  }));
  const alto = Math.max(200, datos.length * 44 + 60);
  return (
    <figure className="space-y-3 rounded-lg border p-4" aria-label="Entregas a tiempo por vehículo">
      <figcaption className="text-sm font-medium">
        Entregas a tiempo por vehículo
        <span className="block text-xs font-normal text-muted-foreground">
          Verde: cumple el umbral de {UMBRAL_SLA_PORCENTAJE} %. Rojo: por debajo.
        </span>
      </figcaption>
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit=" %" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(valor, _nombre, item) => [
                `${formatoPorcentaje(typeof valor === "number" ? valor : 0)} de ${(item.payload as PuntoVehiculo).entregados} entregados`,
                "A tiempo",
              ]}
            />
            <ReferenceLine x={UMBRAL_SLA_PORCENTAJE} stroke="var(--foreground)" strokeDasharray="4 4" />
            <Bar dataKey="porcentaje" name="A tiempo" radius={[0, 4, 4, 0]}>
              {datos.map((punto) => (
                <Cell key={punto.nombre} fill={punto.cumple ? "var(--success)" : "var(--destructive)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Lo mismo en texto, para lectores de pantalla y para quien no distingue los colores. */}
      <ul className="sr-only">
        {datos.map((punto) => (
          <li key={punto.nombre}>{punto.nombre}: {formatoPorcentaje(punto.porcentaje)} a tiempo de {punto.entregados} entregados</li>
        ))}
      </ul>
    </figure>
  );
}
