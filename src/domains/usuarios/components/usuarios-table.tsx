import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { AsyncState } from "@/shared/components/feedback/async-state";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { TableSkeleton, type SkeletonColumnDef } from "@/shared/components/feedback/table-skeleton";
import { useListFilters } from "@/shared/hooks/use-list-filters";
import { PagedTableControls } from "@/shared/components/common/paged-table-controls";
import { DataTable, type Column } from "@/shared/components/common/data-table";
import { useRoles } from "../hooks/use-roles";
import { useUsuarios } from "../hooks/use-usuarios";
import type { Usuario, UsuarioEstado, UsuariosFiltrosParams } from "../usuarios.types";
import { UsuariosTableFilters } from "./usuarios-table-filters";

type SortCol = "nombre" | "ultimoAcceso";

interface UsuariosTableProps {
  puedeAdministrar: boolean;
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
          className="border-success/20 bg-success/10 text-success gap-1.5 font-medium"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
          Activo
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/20 bg-muted text-muted-foreground gap-1.5 font-medium"
        >
          <span className="size-1.5 rounded-full bg-slate-400" aria-hidden />
          Inactivo
        </Badge>
      );
    case "locked":
      return (
        <Badge
          variant="outline"
          className="border-destructive/20 bg-destructive/10 text-destructive gap-1.5 font-medium"
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

export function UsuariosTable({ puedeAdministrar, onEditar, onDesactivar }: UsuariosTableProps) {
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
    ...(puedeAdministrar ? [{ header: "Acciones", type: "actions" as const, className: "w-24 text-right pr-4" }] : []),
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

  const columns: Column<Usuario>[] = [
    {
      id: "name",
      header: (
        <button
          type="button"
          onClick={() => handleSort("nombre")}
          className="flex items-center font-semibold text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Ordenar por nombre"
        >
          Nombre
          <SortIcon active={sortCol === "nombre"} order={sortOrder} />
        </button>
      ),
      ariaSort: sortCol === "nombre" ? (sortOrder === "asc" ? "ascending" : "descending") : "none",
      cell: (u) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{u.nombreCompleto}</span>
          <span className="text-xs text-muted-foreground">@{u.username}</span>
        </div>
      ),
    },
    {
      id: "email",
      header: "Correo",
      cell: (u) => u.email ?? <span className="text-muted-foreground/60">—</span>,
      className: "hidden text-muted-foreground md:table-cell",
    },
    {
      id: "role",
      header: "Rol",
      cell: (u) => <span className="text-sm font-medium">{u.rol.etiqueta}</span>,
    },
    {
      id: "status",
      header: "Estado",
      cell: (u) => <EstadoBadge estado={u.estado} />,
    },
    {
      id: "last-login",
      header: (
        <button
          type="button"
          onClick={() => handleSort("ultimoAcceso")}
          className="flex items-center font-semibold text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Ordenar por último acceso"
        >
          Último Acceso
          <SortIcon active={sortCol === "ultimoAcceso"} order={sortOrder} />
        </button>
      ),
      ariaSort: sortCol === "ultimoAcceso" ? (sortOrder === "asc" ? "ascending" : "descending") : "none",
      cell: (u) => formatUltimoAcceso(u.ultimoAcceso),
      className: "hidden text-sm text-muted-foreground lg:table-cell",
    },
    ...(puedeAdministrar ? [{
      id: "actions",
      header: "Acciones",
      className: "w-32 pr-4 text-right",
      cell: (u: Usuario) => {
        const esRoot = u.rol.nombre === "root";
        return (
          <div className="flex items-center justify-end gap-2">
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
            <Switch
              checked={u.activo}
              disabled={esRoot || !u.activo}
              onCheckedChange={(checked) => { if (!checked) onDesactivar(u); }}
              aria-label={`Desactivar a ${u.nombreCompleto}`}
            />
          </div>
        );
      },
    } satisfies Column<Usuario>] : []),
  ];

  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? Math.max(1, Math.ceil(total / limit));

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Directorio de usuarios">
      <div className="border-b pb-4">
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
      </div>

      <div className="mt-4">
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
          <DataTable columns={columns} data={items} />
        </AsyncState>
      </div>

      {!isError && (
        <div className="mt-4">
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
        </div>
      )}
    </section>
  );
}
