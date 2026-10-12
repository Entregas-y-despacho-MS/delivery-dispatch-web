import { RotateCw } from "lucide-react";

import { SearchField } from "@/shared/components/common/search-field";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";
import type { TurnoFilter, ZonaFilter } from "../hooks/use-bandeja-pedidos";

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
  onRefrescar: () => void;
  refrescando?: boolean;
}

/** Búsqueda (con debounce en el hook), filtros rápidos por zona y turno, y refresco manual. */
export function BandejaPedidosToolbar({
  search,
  onSearchChange,
  zonas,
  zona,
  onZonaChange,
  turno,
  onTurnoChange,
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
      <Button type="button" variant="outline" className="h-10" onClick={onRefrescar} disabled={refrescando}>
        <RotateCw className={cn("size-4", refrescando && "animate-spin")} aria-hidden />
        {refrescando ? "Actualizando…" : "Actualizar"}
      </Button>
    </div>
  );
}
