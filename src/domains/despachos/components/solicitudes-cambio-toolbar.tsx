import { RotateCw } from "lucide-react";

import { SearchField } from "@/shared/components/common/search-field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import type { FiltrosSolicitudes } from "../solicitudes-cambio.url";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface SolicitudesCambioToolbarProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  zonas: { id: number; name: string }[];
  zona: FiltrosSolicitudes["zona"];
  onZonaChange: (valor: FiltrosSolicitudes["zona"]) => void;
  fecha: string;
  onFechaChange: (valor: string) => void;
  onRefrescar: () => void;
  refrescando: boolean;
}

/** Búsqueda por código o cliente, zona, fecha de la ruta y refresco manual. */
export function SolicitudesCambioToolbar({
  busqueda, onBusquedaChange, zonas, zona, onZonaChange, fecha, onFechaChange, onRefrescar, refrescando,
}: SolicitudesCambioToolbarProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground" aria-hidden>Buscar</span>
        <SearchField id="solicitudes-buscar" label="Buscar por código de seguimiento o nombre del cliente" value={busqueda}
          onChange={onBusquedaChange} placeholder="DSP-2026-00045 o Ana Pérez" maxLength={100} />
      </div>
      <div className="space-y-1">
        <label htmlFor="solicitudes-zona" className="text-xs font-medium text-muted-foreground">Zona</label>
        <select id="solicitudes-zona" className={CLASE_SELECT} value={zona} onChange={(e) => onZonaChange(e.target.value as FiltrosSolicitudes["zona"])}>
          <option value="all">Todas</option>
          {zonas.map((z) => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="solicitudes-fecha" className="text-xs font-medium text-muted-foreground">Fecha de la ruta</label>
        <Input id="solicitudes-fecha" type="date" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
      </div>
      <Button type="button" variant="outline" className="h-10" onClick={onRefrescar} disabled={refrescando}>
        <RotateCw className={cn("size-4", refrescando && "animate-spin")} aria-hidden />
        {refrescando ? "Actualizando…" : "Actualizar"}
      </Button>
    </div>
  );
}
