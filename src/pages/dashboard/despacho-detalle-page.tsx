import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, FileSearch, PackageSearch } from "lucide-react";

import { useMotivosReprogramacion } from "@/domains/catalogos";
import { useParametrosOperativos } from "@/domains/configuracion";
import {
  DespachoFicha,
  generarFranjas,
  mensajeErrorReprogramacion,
  puedeReprogramar,
  ReprogramarDespachoDialog,
  useDespachoDetalle,
  useReprogramacionDespacho,
} from "@/domains/despachos";
import { PageHeader } from "@/shared/components/common/page-header";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { ROLES } from "@/config/roles";
import { RequireRole } from "@/shared/guards/require-role";

const MOTIVOS_PARAMS = { page: 1, limit: 100, active: true };
/** Valor por defecto de max_delivery_attempts si el parámetro todavía no está definido. */
const LIMITE_POR_DEFECTO = 3;

/** Ficha 360° del despacho (ST-56.1, RF-A09) con la reprogramación del coordinador (ST-52.1, RF-A05). */
export default function DespachoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const despachoId = Number(id);
  const valido = Number.isInteger(despachoId) && despachoId > 0;
  const detalle = useDespachoDetalle(valido ? despachoId : null);
  const [reprogramando, setReprogramando] = useState(false);
  const noExiste = !valido || (detalle.isError && parseApiError(detalle.error).status === 404);

  const { reprogramar, devolver } = useReprogramacionDespacho(despachoId);
  const { valores } = useParametrosOperativos();
  const franjas = useMemo(() => generarFranjas(valores), [valores]);
  const limiteIntentos = Number(valores.max_delivery_attempts) || LIMITE_POR_DEFECTO;
  const motivosCatalogo = useMotivosReprogramacion(MOTIVOS_PARAMS);
  const motivos = useMemo(
    () => motivosCatalogo.data.filter((motivo) => motivo.active).map(({ code, name }) => ({ code, name })),
    [motivosCatalogo.data],
  );
  const errorAccion = reprogramar.error ?? devolver.error;

  const abrir = (abierto: boolean) => {
    reprogramar.reset();
    devolver.reset();
    setReprogramando(abierto);
  };

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
          <>
            <DespachoFicha
              despacho={detalle.data}
              onRenovar={() => void detalle.refetch()}
              renovando={detalle.isFetching}
              acciones={puedeReprogramar(detalle.data.status.name) && (
                <RequireRole roles={[ROLES.COORDINADOR]}>
                  <Button type="button" onClick={() => abrir(true)}>
                    <CalendarClock aria-hidden /> Reprogramar
                  </Button>
                </RequireRole>
              )}
            />
            <RequireRole roles={[ROLES.COORDINADOR]}>
              <ReprogramarDespachoDialog
                abierto={reprogramando}
                onOpenChange={abrir}
                despacho={detalle.data}
                motivos={motivos}
                franjas={franjas}
                limiteIntentos={limiteIntentos}
                enviando={reprogramar.isPending}
                devolviendo={devolver.isPending}
                error={errorAccion ? mensajeErrorReprogramacion(parseApiError(errorAccion)) : null}
                onReprogramar={(payload) => reprogramar.mutate(payload, { onSuccess: () => setReprogramando(false) })}
                onDevolver={(notas) => devolver.mutate(notas, { onSuccess: () => setReprogramando(false) })}
                onRenovarFotos={() => void detalle.refetch()}
                renovandoFotos={detalle.isFetching}
              />
            </RequireRole>
          </>
        )}
      </div>
    </div>
  );
}
