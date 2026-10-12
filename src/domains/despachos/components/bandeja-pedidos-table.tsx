import {
  createColumnHelper,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import type { OrdenActual } from "../hooks/use-bandeja-pedidos";
import type { OrdenBandeja, PedidoPendiente } from "../despachos.types";
import { formatearFranja, formatearKilos, formatearMetrosCubicos } from "../despachos.format";
import { PedidoBadges, UrgenciaBadge } from "./pedido-badges";

// TanStack Table v9: las features se declaran una vez, fuera del componente.
// columnMeta tipa `meta` de cada columna (las numéricas se alinean a la derecha).
const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  columnMeta: {} as { numerica?: boolean },
});
const columna = createColumnHelper<typeof features, PedidoPendiente>();

/** El id de cada columna es el `sortBy` que entiende el back; las que no ordena llevan enableSorting: false. */
const columnas = columna.columns([
  // Selección para armar la ruta. Los pedidos que planifica otro coordinador no se pueden marcar.
  columna.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Seleccionar los pedidos disponibles de esta página"
        checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
        onCheckedChange={(valor) => table.toggleAllPageRowsSelected(valor === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={row.getCanSelect()
          ? `Seleccionar el pedido ${row.original.orderNumber}`
          : `El pedido ${row.original.orderNumber} lo está planificando ${row.original.reservation?.reservedByName ?? "otro coordinador"}`}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(valor) => row.toggleSelected(valor === true)}
      />
    ),
  }),
  columna.accessor("orderNumber", {
    id: "orderNumber",
    header: "N° de orden",
    cell: ({ row }) => (
      <div className="min-w-36 space-y-1">
        <p className="font-medium tabular-nums">{row.original.orderNumber}</p>
        {row.original.trackingCode && (
          <p className="font-mono text-xs text-muted-foreground">{row.original.trackingCode}</p>
        )}
        <PedidoBadges pedido={row.original} />
      </div>
    ),
  }),
  columna.accessor("recipient", {
    id: "recipient",
    header: "Destinatario",
    cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">Sin nombre</span>,
  }),
  columna.accessor("address", {
    id: "address",
    header: "Dirección",
    enableSorting: false,
    cell: ({ getValue }) => <span className="line-clamp-2 min-w-48">{getValue()}</span>,
  }),
  columna.accessor("zoneName", {
    id: "zone",
    header: "Zona",
    cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">Sin zona</span>,
  }),
  columna.accessor("windowStart", {
    id: "window",
    header: "Franja",
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums">{formatearFranja(row.original.windowStart, row.original.windowEnd)}</span>
    ),
  }),
  columna.accessor("packagesCount", {
    id: "packages",
    header: "Bultos",
    enableSorting: false,
    meta: { numerica: true },
  }),
  columna.accessor("weightKg", {
    id: "weight",
    header: "Peso (kg)",
    meta: { numerica: true },
    cell: ({ getValue }) => formatearKilos(getValue()),
  }),
  columna.accessor("volumeM3", {
    id: "volume",
    header: "Volumen (m³)",
    enableSorting: false,
    meta: { numerica: true },
    cell: ({ getValue }) => formatearMetrosCubicos(getValue()),
  }),
  columna.accessor("priority", {
    id: "priority",
    header: "Prioridad",
    cell: ({ getValue }) => getValue() === "urgent"
      ? <UrgenciaBadge priority="urgent" />
      : <span className="text-muted-foreground">Normal</span>,
  }),
]);

function IconoOrden({ direccion }: { direccion: false | "asc" | "desc" }) {
  if (direccion === "asc") return <ArrowUp className="size-3.5" aria-hidden />;
  if (direccion === "desc") return <ArrowDown className="size-3.5" aria-hidden />;
  return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />;
}

export interface BandejaPedidosTableProps {
  data: PedidoPendiente[];
  orden: OrdenActual | null;
  onToggleOrden: (columna: OrdenBandeja) => void;
  /** Filas marcadas, por id de pedido. */
  seleccion: RowSelectionState;
  onSeleccionChange: (seleccion: RowSelectionState) => void;
}

/** Tabla de la bandeja con TanStack Table v9. El orden lo resuelve el servidor (manualSorting). */
export function BandejaPedidosTable({ data, orden, onToggleOrden, seleccion, onSeleccionChange }: BandejaPedidosTableProps) {
  const sorting: SortingState = orden ? [{ id: orden.sortBy, desc: orden.order === "desc" }] : [];

  const table = useTable({
    features,
    columns: columnas,
    data,
    state: { sorting, rowSelection: seleccion },
    // El clic en el encabezado lo maneja el hook (toggleOrden), que vuelve a pedir la página al servidor.
    onSortingChange: () => {},
    manualSorting: true,
    // `locked`: otro coordinador lo está planificando y no puede entrar en una segunda ruta.
    enableRowSelection: (row) => !row.original.locked,
    onRowSelectionChange: (updater) => onSeleccionChange(typeof updater === "function" ? updater(seleccion) : updater),
    getRowId: (pedido) => String(pedido.id),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((grupo) => (
            <TableRow key={grupo.id} className="hover:bg-transparent">
              {grupo.headers.map((header) => {
                const numerica = header.column.columnDef.meta?.numerica;
                const direccion = header.column.getIsSorted();
                const titulo = <table.FlexRender header={header} />;
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={direccion === "asc" ? "ascending" : direccion === "desc" ? "descending" : undefined}
                    className={cn("font-semibold", numerica && "text-right")}
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={() => onToggleOrden(header.column.id as OrdenBandeja)}
                        className="-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {titulo}
                        <IconoOrden direccion={direccion} />
                      </button>
                    ) : titulo}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
              aria-disabled={!row.getCanSelect() || undefined}
              className={cn("align-top transition-colors hover:bg-muted/40", !row.getCanSelect() && "bg-muted/30 text-muted-foreground")}
            >
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(cell.column.columnDef.meta?.numerica && "text-right tabular-nums")}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
