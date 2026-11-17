import { Inbox } from "lucide-react";

import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { SolicitudesCambioLista, type SolicitudesCambioListaProps } from "./solicitudes-cambio-lista";

interface SolicitudesCambioVistaProps extends SolicitudesCambioListaProps {
  cargando: boolean;
  error?: unknown;
  onReintentar: () => void | Promise<unknown>;
  reintentando?: boolean;
  filtrada: boolean;
  onLimpiarFiltros: () => void;
}

/** Skeleton, error con reintento, vacío o la lista. */
export function SolicitudesCambioVista({ cargando, error, onReintentar, reintentando = false, filtrada, onLimpiarFiltros, ...lista }: SolicitudesCambioVistaProps) {
  if (cargando) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Cargando solicitudes">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
      </div>
    );
  }
  if (error) {
    return <ErrorAlert error={error} title="No pudimos cargar las solicitudes" onRetry={onReintentar} isRetrying={reintentando} />;
  }
  if (lista.data.length === 0) {
    return filtrada ? (
      <NoResultsState
        title="Ninguna solicitud coincide"
        description="Prueba con otro código, cliente, zona o fecha."
        onClearFilters={onLimpiarFiltros}
        bordered
      />
    ) : (
      <EmptyState
        icon={<Inbox className="size-6" aria-hidden />}
        title="No hay solicitudes pendientes"
        description="Cuando un cliente pida un cambio desde su enlace de seguimiento, aparecerá aquí."
      />
    );
  }
  return <SolicitudesCambioLista {...lista} />;
}
