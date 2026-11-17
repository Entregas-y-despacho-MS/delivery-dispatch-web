import { Download, RotateCw } from "lucide-react";

import { SearchField } from "@/shared/components/common/search-field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { etiquetaEstadoDespacho } from "../despacho-detalle.format";
import { ESTADOS_FINALES, type EstadoFinal } from "../types/historial.types";
import type { FiltrosHistorial } from "../historial.url";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export interface ConductorOpcion {
  id: number;
  name: string;
}

interface HistorialDespachosToolbarProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  desde: string;
  onDesdeChange: (valor: string) => void;
  hasta: string;
  onHastaChange: (valor: string) => void;
  conductores: ConductorOpcion[];
  conductor: FiltrosHistorial["conductor"];
  onConductorChange: (valor: FiltrosHistorial["conductor"]) => void;
  placa: string;
  onPlacaChange: (valor: string) => void;
  estado: FiltrosHistorial["estado"];
  onEstadoChange: (valor: "all" | EstadoFinal) => void;
  /** «Desde» es posterior a «Hasta». */
  rangoInvertido: boolean;
  onExportar: () => void;
  exportando: boolean;
  /** Sin filas no hay nada que exportar. */
  puedeExportar: boolean;
  onRefrescar: () => void;
  refrescando: boolean;
}

/** Filtros combinables del historial (rango de fechas, repartidor, vehículo, estado final y código) y exportación. */
export function HistorialDespachosToolbar(props: HistorialDespachosToolbarProps) {
  const {
    busqueda, onBusquedaChange, desde, onDesdeChange, hasta, onHastaChange, conductores, conductor, onConductorChange,
    placa, onPlacaChange, estado, onEstadoChange, rangoInvertido, onExportar, exportando, puedeExportar, onRefrescar, refrescando,
  } = props;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1">
          <label htmlFor="historial-desde" className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input id="historial-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => onDesdeChange(e.target.value)}
            aria-invalid={rangoInvertido || undefined} aria-describedby={rangoInvertido ? "historial-rango-error" : undefined} />
        </div>
        <div className="space-y-1">
          <label htmlFor="historial-hasta" className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input id="historial-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => onHastaChange(e.target.value)}
            aria-invalid={rangoInvertido || undefined} aria-describedby={rangoInvertido ? "historial-rango-error" : undefined} />
        </div>
        <div className="space-y-1">
          <label htmlFor="historial-conductor" className="text-xs font-medium text-muted-foreground">Repartidor</label>
          <select id="historial-conductor" className={CLASE_SELECT} value={conductor}
            onChange={(e) => onConductorChange(e.target.value as FiltrosHistorial["conductor"])}>
            <option value="all">Todos</option>
            {conductores.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="historial-placa" className="text-xs font-medium text-muted-foreground">Vehículo (placa)</label>
          <Input id="historial-placa" value={placa} maxLength={15} placeholder="2345-ABC" onChange={(e) => onPlacaChange(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label htmlFor="historial-estado" className="text-xs font-medium text-muted-foreground">Estado final</label>
          <select id="historial-estado" className={CLASE_SELECT} value={estado} onChange={(e) => onEstadoChange(e.target.value as "all" | EstadoFinal)}>
            <option value="all">Todos</option>
            {ESTADOS_FINALES.map((e) => <option key={e} value={e}>{etiquetaEstadoDespacho(e)}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground" aria-hidden>Código</span>
          <SearchField id="historial-buscar" label="Buscar por código de traslado" value={busqueda} onChange={onBusquedaChange}
            placeholder="DSP-2026-00012" maxLength={100} />
        </div>
      </div>
      {rangoInvertido && (
        <p id="historial-rango-error" role="alert" className="text-sm text-destructive">
          La fecha «Desde» no puede ser posterior a «Hasta».
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="h-10" onClick={onRefrescar} disabled={refrescando}>
          <RotateCw className={cn("size-4", refrescando && "animate-spin")} aria-hidden />
          {refrescando ? "Actualizando…" : "Actualizar"}
        </Button>
        <Button type="button" className="h-10" onClick={onExportar} disabled={exportando || !puedeExportar || rangoInvertido}>
          <Download className="size-4" aria-hidden />
          {exportando ? "Exportando…" : "Exportar CSV"}
        </Button>
      </div>
    </div>
  );
}
