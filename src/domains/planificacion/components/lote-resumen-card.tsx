import type { ReactNode } from "react";
import { CalendarDays, MapPin, Package, Truck, UserRound } from "lucide-react";
import { cn } from "cn";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatearFechaTurno } from "../planificacion.format";
import { BarraOcupacion } from "./ocupacion-lote";

export interface LoteResumenCardProps {
  /** Nombre corto del lote, p. ej. «Lote #12». */
  titulo: string;
  zona: string | null;
  /** `shift_date` del lote (AAAA-MM-DD). */
  fecha: string;
  /** Vehículo propuesto (placa o nombre); null si aún no tiene. */
  vehiculo: string | null;
  cantidadPedidos: number;
  /** Mayor ocupación entre peso y volumen; null si aún no hay vehículo para comparar. */
  ocupacion: number | null;
  /** Coordinador que revisa el lote; null si no tiene revisor y lo ven todos. */
  revisor: string | null;
  seleccionado?: boolean;
  onSeleccionar?: () => void;
}

/** Tarjeta de un lote provisional en la lista de revisión (ST-215.1). */
export function LoteResumenCard({
  titulo,
  zona,
  fecha,
  vehiculo,
  cantidadPedidos,
  ocupacion,
  revisor,
  seleccionado = false,
  onSeleccionar,
}: LoteResumenCardProps) {
  return (
    <Card
      className={cn(
        "relative gap-3 py-4 transition-colors",
        onSeleccionar && "hover:border-primary/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring",
        seleccionado && "border-primary ring-1 ring-primary/30",
      )}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          {onSeleccionar
            ? (
              // El botón cubre toda la tarjeta (after:inset-0) sin anidar bloques dentro de un <button>.
              <button
                type="button"
                className="text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
                onClick={onSeleccionar}
                aria-pressed={seleccionado}
              >
                {titulo}
              </button>
            )
            : <span>{titulo}</span>}
          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <Package className="size-3.5" aria-hidden />
            {`${cantidadPedidos} ${cantidadPedidos === 1 ? "pedido" : "pedidos"}`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 text-xs">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted-foreground">
          <Dato icono={<MapPin aria-hidden />} etiqueta="Zona" valor={zona ?? "Sin zona"} />
          <Dato icono={<CalendarDays aria-hidden />} etiqueta="Fecha" valor={formatearFechaTurno(fecha)} />
          <Dato icono={<Truck aria-hidden />} etiqueta="Vehículo" valor={vehiculo ?? "Sin vehículo"} />
          <Dato icono={<UserRound aria-hidden />} etiqueta="Revisor" valor={revisor ?? "Sin asignar"} />
        </dl>
        {ocupacion === null
          ? <p className="text-muted-foreground">Asigna un vehículo para ver la ocupación.</p>
          : <BarraOcupacion etiqueta="Ocupación" porcentaje={ocupacion} />}
      </CardContent>
    </Card>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
      {icono}
      <dt className="sr-only">{etiqueta}</dt>
      <dd className="truncate">{valor}</dd>
    </div>
  );
}
