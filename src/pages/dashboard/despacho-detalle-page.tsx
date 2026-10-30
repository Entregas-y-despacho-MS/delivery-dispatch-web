import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, FileSearch, PackageSearch } from "lucide-react";

import { DespachoFicha, ReprogramarDialog, useDespachoDetalle } from "@/domains/despachos";
import { PageHeader } from "@/shared/components/common/page-header";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";

/** Ficha 360° del despacho (ST-56.1, RF-A09): /app/despachos/:id. */
export default function DespachoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const despachoId = Number(id);
  const valido = Number.isInteger(despachoId) && despachoId > 0;
  const detalle = useDespachoDetalle(valido ? despachoId : null);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const noExiste = !valido || (detalle.isError && parseApiError(detalle.error).status === 404);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Ficha del despacho"
        icon={PackageSearch}
        description="Trazabilidad completa del pedido: datos, línea de tiempo, evidencias e incidencias."
      />
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/app/tablero"><ArrowLeft aria-hidden /> Volver al tablero</Link>
      </Button>

      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        {noExiste ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <FileSearch className="size-8" aria-hidden />
            <p>Este despacho no existe o el enlace está mal escrito.</p>
          </div>
        ) : detalle.isPending ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : detalle.isError ? (
          <ErrorAlert error={detalle.error} onRetry={() => detalle.refetch()} isRetrying={detalle.isFetching} />
        ) : (
          <div className="space-y-4">
            {detalle.data.status.name !== "delivered" && detalle.data.status.name !== "returned" && detalle.data.route?.shiftDate && (
              <Button variant="outline" size="sm" onClick={() => setResolutionOpen(true)}><CalendarClock aria-hidden /> Reprogramar / devolver</Button>
            )}
            <DespachoFicha despacho={detalle.data} onRenovar={() => void detalle.refetch()} renovando={detalle.isFetching} />
            {detalle.data.route?.shiftDate && <ReprogramarDialog open={resolutionOpen} onOpenChange={setResolutionOpen} despachoId={detalle.data.id} fecha={detalle.data.route.shiftDate} onComplete={() => void detalle.refetch()} />}
          </div>
        )}
      </div>
    </div>
  );
}
