import { Pencil, Power } from "lucide-react";

import { DataTable, type Column } from "@/shared/components/common/data-table";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { Button } from "@/shared/components/ui/button";
import { CardSkeletonList } from "@/shared/components/feedback/card-skeleton-list";
import { Switch } from "@/shared/components/ui/switch";
import type { Zona } from "../catalogos.types";

export function ZonasTable({
  data,
  loading,
  onEdit,
  onDeactivate,
  deactivating = false,
  searchActive = false,
  onClearFilters,
}: {
  data: Zona[];
  loading?: boolean;
  onEdit: (zona: Zona) => void;
  onDeactivate: (zona: Zona) => void;
  deactivating?: boolean;
  searchActive?: boolean;
  onClearFilters?: () => void;
}) {
  const columns: Column<Zona>[] = [
    {
      header: "Código",
      cell: (zona) => <span className="font-mono font-medium tracking-tight">{zona.code}</span>,
      className: "w-[24%]",
    },
    {
      header: "Nombre",
      cell: (zona) => <span className="font-medium">{zona.name}</span>,
      className: "w-[32%]",
    },
    {
      header: "Tiempo estimado",
      cell: (zona) => <span className="tabular-nums">{zona.estimatedTimeMin} min</span>,
      className: "w-[22%] text-right",
    },
    {
      header: "Estado",
      cell: (zona) => (
        <div className="flex items-center gap-3">
          <Switch
            checked
            disabled={deactivating}
            onCheckedChange={(checked) => { if (!checked) onDeactivate(zona); }}
            aria-label={`Desactivar ${zona.name}`}
          />
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <Power aria-hidden /> Activa
          </span>
        </div>
      ),
      className: "w-[22%]",
    },
    {
      header: "",
      cell: (zona) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(zona)}
          aria-label={`Editar ${zona.name}`}
          title="Editar zona"
        >
          <Pencil aria-hidden />
        </Button>
      ),
      className: "w-12 text-right",
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          isFiltered={searchActive}
          onClearFilters={onClearFilters}
          emptyMessage={searchActive ? "No encontramos zonas con ese criterio." : "Crea la primera zona para comenzar a planificar entregas."}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {loading && <CardSkeletonList count={4} />}

        {!loading && data.length === 0 && (
          searchActive ? (
            <NoResultsState
              description="No encontramos zonas con ese criterio."
              onClearFilters={onClearFilters}
              bordered
            />
          ) : (
            <EmptyState
              title="Sin resultados"
              description="Crea la primera zona para comenzar a planificar entregas."
            />
          )
        )}

        {!loading && data.map((zona) => (
          <article key={zona.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-sm font-semibold tracking-tight">{zona.code}</p>
                <h3 className="truncate font-medium">{zona.name}</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(zona)}
                aria-label={`Editar ${zona.name}`}
                title="Editar zona"
              >
                <Pencil aria-hidden />
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 border-t pt-3">
              <div>
                <p className="text-xs text-muted-foreground">Tiempo estimado</p>
                <p className="tabular-nums font-medium">{zona.estimatedTimeMin} min</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  <Power aria-hidden /> Activa
                </span>
                <Switch
                  checked
                  disabled={deactivating}
                  onCheckedChange={(checked) => { if (!checked) onDeactivate(zona); }}
                  aria-label={`Desactivar ${zona.name}`}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
