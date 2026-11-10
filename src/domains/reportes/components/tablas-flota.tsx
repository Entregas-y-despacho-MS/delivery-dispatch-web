import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { ordenarFilasFlota, type FilaVehiculoFlota } from "../reportes.flota";
import { nombreRepartidor, nombreVehiculo, type DireccionOrden } from "../reportes.kpis";
import { cumpleUmbral, formatoMinutos, formatoPorcentaje } from "../reportes.reglas";
import type { FilaSla } from "../types/reportes.types";

interface Columna<T> {
  id: string;
  titulo: string;
  numerica: boolean;
  /** Valor con el que se ordena. */
  valor: (fila: T) => number | string;
  celda: (fila: T) => ReactNode;
  claseCelda?: (fila: T) => string | false | undefined;
}

interface TablaOrdenableProps<T extends FilaSla> {
  titulo: string;
  idTitulo: string;
  filas: readonly T[];
  columnas: readonly Columna<T>[];
  nombre: (fila: T) => string;
  ordenInicial: { columna: string; direccion: DireccionOrden };
  vacio: string;
}

/**
 * Tabla ordenable por cualquier columna: el primer clic ordena los números de mayor a menor y el
 * nombre de la A a la Z; el segundo invierte. La fila sin nombre queda siempre al final.
 */
function TablaOrdenable<T extends FilaSla>({ titulo, idTitulo, filas, columnas, nombre, ordenInicial, vacio }: TablaOrdenableProps<T>) {
  const [orden, setOrden] = useState(ordenInicial);
  const columnaActiva = columnas.find((c) => c.id === orden.columna) ?? columnas[0];
  const ordenadas = ordenarFilasFlota(filas, columnaActiva.valor, orden.direccion, nombre);
  const ordenarPor = (columna: Columna<T>) =>
    setOrden((actual) => actual.columna === columna.id
      ? { columna: columna.id, direccion: actual.direccion === "asc" ? "desc" : "asc" }
      : { columna: columna.id, direccion: columna.numerica ? "desc" : "asc" });

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby={idTitulo}>
      <h3 id={idTitulo} className="text-sm font-medium">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                {columnas.map((columna) => {
                  const activa = orden.columna === columna.id;
                  const Icono = !activa ? ArrowUpDown : orden.direccion === "asc" ? ArrowUp : ArrowDown;
                  return (
                    <th
                      key={columna.id}
                      scope="col"
                      aria-sort={activa ? (orden.direccion === "asc" ? "ascending" : "descending") : "none"}
                      className={cn("py-2 font-medium", columna.numerica ? "text-right" : "text-left")}
                    >
                      <button
                        type="button"
                        onClick={() => ordenarPor(columna)}
                        className={cn("inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activa && "text-foreground")}
                      >
                        {columna.titulo}
                        <Icono className="size-3.5" aria-hidden />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((fila) => (
                <tr key={fila.groupId ?? "sin-nombre"} className="border-b last:border-0">
                  {columnas.map((columna, indice) => indice === 0 ? (
                    <th key={columna.id} scope="row" className={cn("py-2 text-left font-medium", fila.groupName === null && "text-muted-foreground")}>
                      {columna.celda(fila)}
                    </th>
                  ) : (
                    <td key={columna.id} className={cn("py-2 tabular-nums", columna.numerica && "text-right", columna.claseCelda?.(fila))}>
                      {columna.celda(fila)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const porcentaje = <T extends FilaSla>(): Columna<T> => ({
  id: "aTiempo",
  titulo: "% a tiempo",
  numerica: true,
  valor: (f) => f.onTimePercentage,
  celda: (f) => (f.deliveredCount === 0 ? "—" : formatoPorcentaje(f.onTimePercentage)),
  claseCelda: (f) => f.deliveredCount > 0 && (cumpleUmbral(f.onTimePercentage) ? "font-medium text-success" : "font-medium text-destructive"),
});

const incidencias = <T extends FilaSla>(): Columna<T> => ({
  id: "incidencias",
  titulo: "Incidencias",
  numerica: true,
  valor: (f) => f.incidentCount,
  celda: (f) => f.incidentCount,
  claseCelda: (f) => f.incidentCount > 0 && "font-medium text-warning",
});

const COLUMNAS_VEHICULO: readonly Columna<FilaVehiculoFlota>[] = [
  { id: "nombre", titulo: "Vehículo", numerica: false, valor: nombreVehiculo, celda: nombreVehiculo },
  { id: "entregados", titulo: "Entregados", numerica: true, valor: (f) => f.deliveredCount, celda: (f) => f.deliveredCount },
  porcentaje<FilaVehiculoFlota>(),
  incidencias<FilaVehiculoFlota>(),
  { id: "mantenimientos", titulo: "Mantenimientos", numerica: true, valor: (f) => f.maintenanceCount, celda: (f) => f.maintenanceCount },
  { id: "diasMantenimiento", titulo: "Días en mantenimiento", numerica: true, valor: (f) => f.daysInMaintenance, celda: (f) => f.daysInMaintenance },
];

const COLUMNAS_REPARTIDOR: readonly Columna<FilaSla>[] = [
  { id: "nombre", titulo: "Repartidor", numerica: false, valor: nombreRepartidor, celda: nombreRepartidor },
  { id: "cerrados", titulo: "Cerrados", numerica: true, valor: (f) => f.closedCount, celda: (f) => f.closedCount },
  { id: "entregados", titulo: "Entregados", numerica: true, valor: (f) => f.deliveredCount, celda: (f) => f.deliveredCount },
  porcentaje<FilaSla>(),
  { id: "demora", titulo: "Demora promedio", numerica: true, valor: (f) => f.averageDelayMinutes ?? -1, celda: (f) => formatoMinutos(f.averageDelayMinutes) },
  incidencias<FilaSla>(),
];

/** Rendimiento y mantenimientos por vehículo. Empieza por más días en mantenimiento. */
export function TablaVehiculosFlota({ filas }: { filas: readonly FilaVehiculoFlota[] }) {
  return (
    <TablaOrdenable
      titulo="Por vehículo"
      idTitulo="flota-vehiculos-titulo"
      filas={filas}
      columnas={COLUMNAS_VEHICULO}
      nombre={nombreVehiculo}
      ordenInicial={{ columna: "diasMantenimiento", direccion: "desc" }}
      vacio="Ningún vehículo tuvo entregas ni mantenimientos en el período."
    />
  );
}

/** Rendimiento e incidencias por repartidor. Empieza por % a tiempo de mayor a menor. */
export function TablaRepartidoresFlota({ filas }: { filas: readonly FilaSla[] }) {
  return (
    <TablaOrdenable
      titulo="Por repartidor"
      idTitulo="flota-repartidores-titulo"
      filas={filas}
      columnas={COLUMNAS_REPARTIDOR}
      nombre={nombreRepartidor}
      ordenInicial={{ columna: "aTiempo", direccion: "desc" }}
      vacio="Ningún repartidor cerró despachos en el período."
    />
  );
}
