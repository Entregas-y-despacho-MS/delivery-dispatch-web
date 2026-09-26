import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Pencil,
  UserX,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { TableSkeletonRows, type SkeletonColumnDef } from "@/shared/components/feedback/table-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useRoles } from "../hooks/use-roles";
import { useUsuarios } from "../hooks/use-usuarios";
import type { Usuario, UsuarioEstado, UsuariosFiltrosParams } from "../usuarios.types";
import { UsuariosTableFilters } from "./usuarios-table-filters";

type SortCol = "nombre" | "correo" | "rol" | "estado" | "ultimoAcceso";

interface UsuariosTableProps {
  onEditar: (usuario: Usuario) => void;
  onDesactivar: (usuario: Usuario) => void;
}

/** Formatea una fecha ISO a fecha y hora en formato legible local. */
function formatUltimoAcceso(fechaIso: string | null): string {
  if (!fechaIso) return "Nunca";
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return "Nunca";
    return new Intl.DateTimeFormat("es-BO", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return "Nunca";
  }
}

/** Badges cromáticos representativos de los estados operativos. */
function EstadoBadge({ estado }: { estado: UsuarioEstado }) {
  switch (estado) {
    case "active":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1.5 font-medium"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
          Activo
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="outline"
          className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 gap-1.5 font-medium"
        >
          <span className="size-1.5 rounded-full bg-slate-400" aria-hidden />
          Inactivo
        </Badge>
      );
    case "locked":
      return (
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 gap-1.5 font-medium"
        >
          <span className="size-1.5 rounded-full bg-rose-500" aria-hidden />
          Bloqueado
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

/** Ícono indicador de sentido de ordenamiento en cabeceras. */
function SortIcon({ active, order }: { active: boolean; order?: "asc" | "desc" }) {
  if (!active) {
    return <ChevronsUpDown className="ml-1 size-3.5 text-muted-foreground/60 shrink-0" aria-hidden />;
  }
  if (order === "asc") {
    return <ChevronUp className="ml-1 size-3.5 text-foreground shrink-0" aria-hidden />;
  }
  return <ChevronDown className="ml-1 size-3.5 text-foreground shrink-0" aria-hidden />;
}

export function UsuariosTable({ onEditar, onDesactivar }: UsuariosTableProps) {
  // Filtros reactivos
  const [search, setSearch] = useState("");
  const [rolId, setRolId] = useState("todos");
  const [estado, setEstado] = useState("todos");

  // Ordenamiento interactivo
  const [sortCol, setSortCol] = useState<SortCol>("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Paginación server-side
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce de 300ms en el campo de búsqueda
  const debouncedSearch = useDebounce(search, 300);

  // Carga de catálogo de roles para selector
  const { data: roles, isPending: loadingRoles } = useRoles();

  // Construcción de parámetros para el backend
  const queryParams: UsuariosFiltrosParams = useMemo(() => {
    const params: UsuariosFiltrosParams = {
      page,
      limit,
    };

    const trimmed = debouncedSearch.trim();
    if (trimmed) params.search = trimmed;

    if (rolId !== "todos") {
      const parsedRoleId = Number(rolId);
      if (!isNaN(parsedRoleId)) params.roleId = parsedRoleId;
    }

    if (estado !== "todos") {
      params.status = estado as UsuarioEstado;
    }

    // Ordenamiento soportado en backend
    if (sortCol === "nombre") {
      params.sortBy = "fullName";
      params.sortOrder = sortOrder;
    } else if (sortCol === "ultimoAcceso") {
      params.sortBy = "lastLoginAt";
      params.sortOrder = sortOrder;
    }

    return params;
  }, [page, limit, debouncedSearch, rolId, estado, sortCol, sortOrder]);

  const { data, isPending, isError, error, refetch } = useUsuarios(queryParams);

  // Detección de filtros activos y callback para reseteo rápido
  const isFiltered = Boolean(search.trim() || rolId !== "todos" || estado !== "todos");

  const handleClearFilters = () => {
    setSearch("");
    setRolId("todos");
    setEstado("todos");
    setPage(1);
  };

  const SKELETON_COLUMNS: SkeletonColumnDef[] = [
    { type: "subtitle" },
    { type: "text", className: "hidden md:table-cell" },
    { type: "text" },
    { type: "badge" },
    { type: "text", className: "hidden lg:table-cell" },
    { type: "actions", className: "w-24 text-right pr-4" },
  ];

  // Manejo de cambio de ordenamiento por cabecera
  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortOrder("asc");
    }
  };

  // Manejo de búsqueda con reinicio a página 1
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Manejo de rol con reinicio a página 1
  const handleRolChange = (value: string) => {
    setRolId(value);
    setPage(1);
  };

  // Manejo de estado con reinicio a página 1
  const handleEstadoChange = (value: string) => {
    setEstado(value);
    setPage(1);
  };

  // Ordenamiento local complementario si la columna activa no es soportada en backend
  const userItems = data?.items;
  const items = useMemo(() => {
    const list = userItems ? [...userItems] : [];
    if (sortCol === "correo") {
      list.sort((a, b) => {
        const mailA = a.email ?? "";
        const mailB = b.email ?? "";
        return sortOrder === "asc"
          ? mailA.localeCompare(mailB)
          : mailB.localeCompare(mailA);
      });
    } else if (sortCol === "rol") {
      list.sort((a, b) => {
        const rolA = a.rol.etiqueta ?? "";
        const rolB = b.rol.etiqueta ?? "";
        return sortOrder === "asc"
          ? rolA.localeCompare(rolB)
          : rolB.localeCompare(rolA);
      });
    } else if (sortCol === "estado") {
      list.sort((a, b) => {
        return sortOrder === "asc"
          ? a.estado.localeCompare(b.estado)
          : b.estado.localeCompare(a.estado);
      });
    }
    return list;
  }, [userItems, sortCol, sortOrder]);

  // Cálculos de rango para texto de paginación
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? Math.max(1, Math.ceil(total / limit));
  const desde = total > 0 ? (page - 1) * limit + 1 : 0;
  const hasta = total > 0 ? Math.min(page * limit, total) : 0;

  return (
    <div className="space-y-4">
      {/* Controles de búsqueda y filtros */}
      <UsuariosTableFilters
        search={search}
        onSearchChange={handleSearchChange}
        rolId={rolId}
        onRolIdChange={handleRolChange}
        estado={estado}
        onEstadoChange={handleEstadoChange}
        roles={roles}
        loadingRoles={loadingRoles}
      />

      {/* Manejo de error con reintento automático y manual */}
      {isError && (
        <ErrorAlert
          error={error}
          onRetry={() => refetch()}
          autoRetry={5}
        />
      )}

      {/* Tabla responsiva */}
      {!isError && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {/* Nombre */}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("nombre")}
                    className="flex items-center font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Ordenar por nombre"
                  >
                    Nombre
                    <SortIcon active={sortCol === "nombre"} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Correo (oculto en móviles) */}
                <TableHead className="hidden md:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSort("correo")}
                    className="flex items-center font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Ordenar por correo"
                  >
                    Correo
                    <SortIcon active={sortCol === "correo"} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Rol */}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("rol")}
                    className="flex items-center font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Ordenar por rol"
                  >
                    Rol
                    <SortIcon active={sortCol === "rol"} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Estado */}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("estado")}
                    className="flex items-center font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Ordenar por estado"
                  >
                    Estado
                    <SortIcon active={sortCol === "estado"} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Último Acceso (oculto en pantallas pequeñas) */}
                <TableHead className="hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSort("ultimoAcceso")}
                    className="flex items-center font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Ordenar por último acceso"
                  >
                    Último Acceso
                    <SortIcon active={sortCol === "ultimoAcceso"} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Acciones */}
                <TableHead className="w-24 text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Estado de carga con Skeleton anatómico */}
              {isPending && (
                <TableSkeletonRows
                  columns={SKELETON_COLUMNS}
                  rows={Math.min(limit, 10)}
                />
              )}

              {/* Sin resultados / Filtros sin coincidencias */}
              {!isPending && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-56 text-center">
                    {isFiltered ? (
                      <NoResultsState onClearFilters={handleClearFilters} />
                    ) : (
                      <EmptyState
                        title="Sin usuarios registrados"
                        description="Aún no hay usuarios dados de alta en el sistema."
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}

              {/* Filas de usuarios */}
              {!isPending &&
                items.map((u) => {
                  const esRoot = u.rol.nombre === "root";
                  return (
                    <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                      {/* Nombre y usuario */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{u.nombreCompleto}</span>
                          <span className="text-xs text-muted-foreground">@{u.username}</span>
                        </div>
                      </TableCell>

                      {/* Correo */}
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {u.email ?? <span className="text-muted-foreground/60">—</span>}
                      </TableCell>

                      {/* Rol */}
                      <TableCell>
                        <span className="text-sm font-medium">{u.rol.etiqueta}</span>
                      </TableCell>

                      {/* Estado con Badge cromático */}
                      <TableCell>
                        <EstadoBadge estado={u.estado} />
                      </TableCell>

                      {/* Último Acceso */}
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatUltimoAcceso(u.ultimoAcceso)}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditar(u)}
                            disabled={esRoot}
                            aria-label={`Editar a ${u.nombreCompleto}`}
                            className="size-8"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDesactivar(u)}
                            disabled={esRoot || !u.activo}
                            aria-label={`Desactivar a ${u.nombreCompleto}`}
                            className="size-8 text-destructive hover:text-destructive"
                          >
                            <UserX className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pie de tabla con controles de paginación */}
      {!isError && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground px-1">
          <div>
            {total > 0 ? (
              <span>
                Mostrando <span className="font-medium text-foreground">{desde}</span>–
                <span className="font-medium text-foreground">{hasta}</span> de{" "}
                <span className="font-medium text-foreground">{total}</span> usuarios
              </span>
            ) : (
              <span>0 usuarios</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Selector de registros por página */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Filas:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[72px]" aria-label="Cantidad de filas por página">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Navegación de páginas */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs">
                Pág. <span className="font-medium text-foreground">{page}</span> de{" "}
                <span className="font-medium text-foreground">{totalPages || 1}</span>
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isPending}
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isPending}
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
