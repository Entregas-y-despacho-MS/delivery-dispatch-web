import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { useDespachoDetalle } from "../hooks/use-despacho-detalle";
import { useReprogramacionDespacho } from "../hooks/use-reprogramacion-despacho";
import { mensajeErrorReprogramacion, type Franja } from "../reprogramacion.reglas";
import { ReprogramarDespachoDialog, type MotivoOpcion } from "./reprogramar-despacho-dialog";

interface ResolverSolicitudDialogProps {
  /** Despacho a resolver; null = cerrado. */
  dispatchId: number | null;
  trackingCode?: string;
  onCerrar: () => void;
  motivos: MotivoOpcion[];
  franjas: Franja[];
  limiteIntentos: number;
}

/**
 * Resolver una solicitud de cambio = reprogramar con el modal de la ST-52.1. El back marca la solicitud
 * como resuelta y la bandeja se refresca sola (la reprogramación invalida su caché).
 */
export function ResolverSolicitudDialog({ dispatchId, trackingCode, onCerrar, motivos, franjas, limiteIntentos }: ResolverSolicitudDialogProps) {
  const detalle = useDespachoDetalle(dispatchId);
  const { reprogramar, devolver } = useReprogramacionDespacho(dispatchId ?? 0);
  const errorAccion = reprogramar.error ?? devolver.error;

  const cerrar = () => {
    reprogramar.reset();
    devolver.reset();
    onCerrar();
  };

  if (dispatchId === null) return null;

  if (!detalle.isSuccess) {
    return (
      <Dialog open onOpenChange={(abierto) => !abierto && cerrar()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar {trackingCode}</DialogTitle>
            <DialogDescription>Cargando el historial del despacho…</DialogDescription>
          </DialogHeader>
          {detalle.isError ? (
            <ErrorAlert error={detalle.error} title="No pudimos abrir el despacho" onRetry={() => detalle.refetch()} isRetrying={detalle.isFetching} />
          ) : (
            <div className="space-y-2" aria-busy="true"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-24 w-full" /></div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ReprogramarDespachoDialog
      abierto
      onOpenChange={(abierto) => !abierto && cerrar()}
      despacho={detalle.data}
      motivos={motivos}
      franjas={franjas}
      limiteIntentos={limiteIntentos}
      enviando={reprogramar.isPending}
      devolviendo={devolver.isPending}
      error={errorAccion ? mensajeErrorReprogramacion(parseApiError(errorAccion)) : null}
      onReprogramar={(payload) => reprogramar.mutate(payload, { onSuccess: cerrar })}
      onDevolver={(notas) => devolver.mutate(notas, { onSuccess: cerrar })}
      onRenovarFotos={() => void detalle.refetch()}
      renovandoFotos={detalle.isFetching}
    />
  );
}
