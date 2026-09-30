import { SearchField } from "@/shared/components/common/search-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import type { BloqueoFilter, SeveridadFilter } from "../hooks/use-tipos-incidente-vehiculo-screen";
import { SEVERIDADES_INCIDENTE_VEHICULO } from "../tipos-incidente-vehiculo.constants";

interface TiposIncidenteVehiculoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  severity: SeveridadFilter;
  onSeverityChange: (value: SeveridadFilter) => void;
  blocking: BloqueoFilter;
  onBlockingChange: (value: BloqueoFilter) => void;
}

export function TiposIncidenteVehiculoFilters({
  search,
  onSearchChange,
  severity,
  onSeverityChange,
  blocking,
  onBlockingChange,
}: TiposIncidenteVehiculoFiltersProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <SearchField id="fallas-search" label="Buscar tipos de falla" value={search}
        onChange={onSearchChange} maxLength={100} placeholder="Frenos o MEC-FRE-01"
        className="sm:min-w-56 sm:flex-1 lg:max-w-80" />
      <Select value={severity} onValueChange={(value: SeveridadFilter) => onSeverityChange(value)}>
        <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrar por severidad">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda severidad</SelectItem>
          {SEVERIDADES_INCIDENTE_VEHICULO.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={blocking} onValueChange={(value: BloqueoFilter) => onBlockingChange(value)}>
        <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Filtrar por bloqueo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las unidades</SelectItem>
          <SelectItem value="blocking">Bloquea unidad</SelectItem>
          <SelectItem value="nonblocking">No bloquea unidad</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
