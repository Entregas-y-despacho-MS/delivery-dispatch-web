import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Pencil,
  UserX,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { AsyncState } from "@/shared/components/feedback/async-state";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { TableSkeleton, type SkeletonColumnDef } from "@/shared/components/feedback/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import { PagedTableControls } from "@/shared/components/common/paged-table-controls";
import { useRoles } from "../hooks/use-roles";
import { useUsuarios } from "../hooks/use-usuarios";
import type { Usuario, UsuarioEstado, UsuariosFiltrosParams } from "../usuarios.types";
import { UsuariosTableFilters } from "./usuarios-table-filters";

type SortCol = "nombre" | "ultimoAcceso";

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
  const list = useListFilters<{ role: string; status: string }>({ role: "todos", status: "todos" });
  const { search, debouncedSearch, page, setPage, clearFilters, hasFilters } = list;
  const rolId = list.filters.role;
  const estado = list.filters.status;

  // Ordenamiento interactivo
  const [sortCol, setSortCol] = useState<SortCol>("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [limit, setLimit] = useState(10);

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

    params.sortBy = sortCol === "nombre" ? "fullName" : "lastLoginAt";
    params.sortOrder = sortOrder;

    return params;
  }, [page, limit, debouncedSearch, rolId, estado, sortCol, sortOrder]);

  const { data, isPending, isError, error, refetch } = useUsuarios(queryParams);

  const SKELETON_COLUMNS: SkeletonColumnDef[] = [
    { header: "Nombre", type: "subtitle" },
    { header: "Correo", type: "text", className: "hidden md:table-cell" },
    { header: "Rol", type: "text" },
    { header: "Estado", type: "badge" },
    { header: "Último Acceso", type: "text", className: "hidden lg:table-cell" },
    { header: "Acciones", type: "actions", className: "w-24 text-right pr-4" },
  ];

  // Manejo de cambio de ordenamiento por cabecera
  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const items = data?.items ?? [];

  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Controles de búsqueda y filtros */}
      <UsuariosTableFilters
        search={search}
        onSearchChange={list.setSearch}
        rolId={rolId}
        onRolIdChange={(value) => list.setFilter("role", value)}
        estado={estado}
        onEstadoChange={(value) => list.setFilter("status", value)}
        roles={roles}
        loadingRoles={loadingRoles}
      />

      <AsyncState
        loading={isPending}
        error={isError ? error : undefined}
        empty={items.length === 0}
        loadingFallback={<TableSkeleton columns={SKELETON_COLUMNS} rows={Math.min(limit, 10)} />}
        emptyFallback={hasFilters
          ? <NoResultsState onClearFilters={clearFilters} bordered />
          : <EmptyState title="Sin usuarios registrados" description="Aún no hay usuarios dados de alta en el sistema." />}
        onRetry={() => refetch()}
      >
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {/* Nombre */}
                <TableHead
                  aria-sort={sortCol === "nombre" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("nombre")}
                    className="flex items-center font-semibold text-foreground hover:text-brand-blue transition-colors cursor-pointer select-none"
                    aria-label="Ordenar por nombre"
                  >
                    Nombre
                    <SortIcon active={sortCol === "nombre"} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Correo (oculto en móviles) */}
                <TableHead className="hidden md:table-cell font-semibold text-foreground">Correo</TableHead>

                {/* Rol */}
                <TableHead className="font-semibold text-foreground">Rol</TableHead>

                {/* Estado */}
                <TableHead className="font-semibold text-foreground">Estado</TableHead>

                {/* Último Acceso (oculto en pantallas pequeñas) */}
                <TableHead
                  className="hidden lg:table-cell"
                  aria-sort={sortCol === "ultimoAcceso" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("ultimoAcceso")}
                    className="flex items-center font-semibold text-foreground hover:text-brand-blue transition-colors cursor-pointer select-none"
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
              {/* Filas de usuarios */}
              {items.map((u) => {
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
      </AsyncState>

      {!isError && (
        <PagedTableControls
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          pageSize={limit}
          onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
          itemLabel="usuarios"
          busy={isPending}
        />
      )}
    </div>
  );
}
