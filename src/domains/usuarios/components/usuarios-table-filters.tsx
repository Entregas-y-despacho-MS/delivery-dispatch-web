import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { Rol } from "../usuarios.types";

interface UsuariosTableFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  rolId: string;
  onRolIdChange: (value: string) => void;
  estado: string;
  onEstadoChange: (value: string) => void;
  roles?: Rol[];
  loadingRoles?: boolean;
}

export function UsuariosTableFilters({
  search,
  onSearchChange,
  rolId,
  onRolIdChange,
  estado,
  onEstadoChange,
  roles,
  loadingRoles,
}: UsuariosTableFiltersProps) {
  // Roles operativos especificados por el requerimiento: Coordinador, Supervisor, Repartidor
  const rolesOperativos = [
    roles?.find((r) => r.nombre === "coordinator"),
    roles?.find((r) => r.nombre === "supervisor"),
    roles?.find((r) => r.nombre === "driver"),
  ].filter((r): r is Rol => Boolean(r));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Barra de búsqueda con icono */}
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden
        />
        <Input
          placeholder="Buscar por nombre, usuario o correo..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
          aria-label="Buscar usuarios"
        />
      </div>

      {/* Selectores de filtrado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Selector de Rol */}
        <Select value={rolId} onValueChange={onRolIdChange} disabled={loadingRoles}>
          <SelectTrigger className="w-full sm:w-[170px] h-9" aria-label="Filtrar por rol">
            <SelectValue placeholder="Rol: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Rol: Todos</SelectItem>
            {rolesOperativos.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.nombre === "coordinator"
                  ? "Coordinador"
                  : r.nombre === "supervisor"
                  ? "Supervisor"
                  : "Repartidor"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector de Estado */}
        <Select value={estado} onValueChange={onEstadoChange}>
          <SelectTrigger className="w-full sm:w-[160px] h-9" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Estado: Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
            <SelectItem value="locked">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
