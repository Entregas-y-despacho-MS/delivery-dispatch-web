import { Button } from "@/shared/components/ui/button";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  reportedPage?: number;
  total?: number;
  busy?: boolean;
}

export function PaginationControls({ page, totalPages, onPageChange, reportedPage, total, busy = false }: PaginationControlsProps) {
  const lastPage = Math.max(1, totalPages);
  return (
    <nav aria-label="Paginación" className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Página <span className="font-medium text-foreground">{reportedPage ?? page}</span> de {lastPage}
        {total !== undefined && <span className="ml-2">· {total} en total</span>}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1 || busy}
          onClick={() => onPageChange(Math.max(1, page - 1))}>Anterior</Button>
        <Button type="button" variant="outline" size="sm" disabled={page >= lastPage || busy}
          onClick={() => onPageChange(Math.min(lastPage, page + 1))}>Siguiente</Button>
      </div>
    </nav>
  );
}
