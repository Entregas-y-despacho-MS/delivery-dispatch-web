import { RotateCw } from "lucide-react";

import { SearchField } from "@/shared/components/common/search-field";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { PrioridadFilter, TurnoFilter, ZonaFilter } from "../hooks/use-bandeja-pedidos";

/** Opción de zona para el filtro. La página la arma con el catálogo de zonas. */
export interface ZonaOpcion {
  id: number;
  name: string;
}

interface BandejaPedidosToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  zonas: ZonaOpcion[];
  zona: ZonaFilter;
  onZonaChange: (value: ZonaFilter) => void;
  turno: TurnoFilter;
  onTurnoChange: (value: TurnoFilter) => void;
  prioridad: PrioridadFilter;
  onPrioridadChange: (value: PrioridadFilter) => void;
  /** Interruptor «Solo urgentes»: urgentes ordenados por vencimiento de SLA. */
  soloUrgentes: boolean;
  onSoloUrgentesChange: (activo: boolean) => void;
  onRefrescar: () => void;
  refrescando?: boolean;
}

/** Búsqueda (con debounce en el hook), filtros rápidos por zona, turno y prioridad, y refresco manual. */
export function BandejaPedidosToolbar({
  search,
  onSearchChange,
  zonas,
  zona,
  onZonaChange,
  turno,
  onTurnoChange,
  prioridad,
  onPrioridadChange,
  soloUrgentes,
  onSoloUrgentesChange,
  onRefrescar,
  refrescando = false,
}: BandejaPedidosToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchField
        id="bandeja-pedidos-search"
        label="Buscar pedidos por destinatario o código de guía"
        value={search}
        onChange={onSearchChange}
        placeholder="María Pérez o DSP-2026-00012"
        maxLength={100}
        className="sm:min-w-64 sm:flex-1 lg:max-w-sm"
      />
      <Select value={zona} onValueChange={(value: ZonaFilter) => onZonaChange(value)}>
        <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Filtrar por zona logística">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las zonas</SelectItem>
          {zonas.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={turno} onValueChange={(value: TurnoFilter) => onTurnoChange(value)}>
        <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrar por turno">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo el día</SelectItem>
          <SelectItem value="morning">Mañana</SelectItem>
          <SelectItem value="afternoon">Tarde</SelectItem>
        </SelectContent>
      </Select>
      <Select value={prioridad} onValueChange={(value: PrioridadFilter) => onPrioridadChange(value)}>
        <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrar por prioridad">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda prioridad</SelectItem>
          <SelectItem value="urgent">Urgentes</SelectItem>
          <SelectItem value="normal">Normales</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3">
        <Switch
          id="bandeja-solo-urgentes"
          checked={soloUrgentes}
          onCheckedChange={onSoloUrgentesChange}
          aria-describedby="bandeja-solo-urgentes-ayuda"
        />
        <Label htmlFor="bandeja-solo-urgentes" className="cursor-pointer whitespace-nowrap">Solo urgentes</Label>
        <span id="bandeja-solo-urgentes-ayuda" className="sr-only">Muestra solo los pedidos urgentes, primero los que vencen antes.</span>
      </div>
      <Button type="button" variant="outline" className="h-10" onClick={onRefrescar} disabled={refrescando}>
        <RotateCw className={cn("size-4", refrescando && "animate-spin")} aria-hidden />
        {refrescando ? "Actualizando…" : "Actualizar"}
      </Button>
    </div>
  );
}
