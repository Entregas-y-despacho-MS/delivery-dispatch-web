import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

interface PagedTableControlsProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel: string;
  busy?: boolean;
}

/** Rango, tamaño de página y navegación para tablas paginadas por el servidor. */
export function PagedTableControls({ page, totalPages, total, pageSize, onPageChange,
  onPageSizeChange, pageSizeOptions = [10, 20, 50], itemLabel, busy = false }: PagedTableControlsProps) {
  const lastPage = Math.max(1, totalPages);
  const first = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const last = total > 0 ? Math.min(page * pageSize, total) : 0;

  return (
    <nav aria-label="Paginación" className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground px-1">
      <div>{total > 0 ? <span>Mostrando <span className="font-medium text-foreground">{first}</span>–<span className="font-medium text-foreground">{last}</span> de <span className="font-medium text-foreground">{total}</span> {itemLabel}</span> : <span>0 {itemLabel}</span>}</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs">Filas:</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[72px]" aria-label="Cantidad de filas por página"><SelectValue /></SelectTrigger>
            <SelectContent>{pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">Pág. <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{lastPage}</span></span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1 || busy} aria-label="Página anterior"><ChevronLeft className="size-4" aria-hidden /></Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(Math.min(lastPage, page + 1))} disabled={page >= lastPage || busy} aria-label="Página siguiente"><ChevronRight className="size-4" aria-hidden /></Button>
        </div>
      </div>
    </nav>
  );
}
