import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { etiquetaEstadoDespacho, formatearFechaHoraExacta } from "../despacho-detalle.format";
import type { DespachoHistorial, OrdenHistorial } from "../historial.types";

const VARIANTE_ESTADO: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  delivered: "default",
  not_delivered: "destructive",
  cancelled: "outline",
};

interface Columna {
  titulo: string;
  orden?: OrdenHistorial;
  celda: (fila: DespachoHistorial) => React.ReactNode;
}

const fechaOGuion = (valor: string | null) => (valor ? formatearFechaHoraExacta(valor) : "—");

export interface HistorialDespachosTablaProps {
  data: DespachoHistorial[];
  orden: OrdenHistorial;
  dir: "asc" | "desc";
  onToggleOrden: (orden: OrdenHistorial) => void;
  /** Link a la ficha 360° de cada despacho. */
  hrefFicha: (id: number) => string;
}

/** Tabla del historial. El orden lo resuelve el servidor; el código lleva a la ficha del despacho. */
export function HistorialDespachosTabla({ data, orden, dir, onToggleOrden, hrefFicha }: HistorialDespachosTablaProps) {
  const columnas: Columna[] = [
    {
      titulo: "Código",
      orden: "trackingCode",
      celda: (f) => (
        <Link to={hrefFicha(f.id)} className="font-medium text-primary underline-offset-4 hover:underline" aria-label={`Ver ficha de ${f.trackingCode}`}>
          {f.trackingCode}
        </Link>
      ),
    },
    { titulo: "Cliente", orden: "recipient", celda: (f) => f.recipient ?? "—" },
    { titulo: "Repartidor", orden: "driver", celda: (f) => f.driverName ?? "Sin asignar" },
    { titulo: "Vehículo", orden: "plate", celda: (f) => f.plate ?? "—" },
    { titulo: "Partida", celda: (f) => fechaOGuion(f.departedAt) },
    { titulo: "Entrega", celda: (f) => fechaOGuion(f.deliveredAt) },
    {
      titulo: "Estado final",
      orden: "status",
      celda: (f) => <Badge variant={VARIANTE_ESTADO[f.status] ?? "secondary"}>{etiquetaEstadoDespacho(f.status)}</Badge>,
    },
    { titulo: "Cierre", orden: "closedAt", celda: (f) => formatearFechaHoraExacta(f.closedAt) },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columnas.map((col) => {
              const activa = col.orden === orden;
              const Icono = activa ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
              return (
                <TableHead key={col.titulo} className="whitespace-nowrap font-semibold"
                  aria-sort={activa ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                  {col.orden ? (
                    <button type="button" onClick={() => onToggleOrden(col.orden as OrdenHistorial)}
                      className="-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {col.titulo}
                      <Icono className={activa ? "size-3.5" : "size-3.5 opacity-50"} aria-hidden />
                    </button>
                  ) : col.titulo}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((fila) => (
            <TableRow key={fila.id} className="hover:bg-muted/40">
              {columnas.map((col) => (
                <TableCell key={col.titulo} className="whitespace-nowrap">{col.celda(fila)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
