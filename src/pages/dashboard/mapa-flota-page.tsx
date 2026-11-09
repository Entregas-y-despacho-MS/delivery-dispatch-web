import { useEffect, useState } from "react";
import { Radio, RadioTower } from "lucide-react";

import { MapaPosicionesFlota, usePosicionesFlota } from "@/domains/flota";
import { PageHeader } from "@/shared/components/common/page-header";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";

const TICK_SENAL_MS = 15_000;

export default function MapaFlotaPage() {
  const { posiciones, umbrales, connected } = usePosicionesFlota();
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setAhora(Date.now()), TICK_SENAL_MS);
    return () => window.clearInterval(timer);
  }, []);
  const cargando = posiciones.isPending || umbrales.umbrales.isPending;
  const errorPosiciones = posiciones.isError;
  const errorUmbral = umbrales.umbrales.isError;
  const sinUmbral = umbrales.umbrales.data?.gpsStaleAlertMinutes === undefined;
  const umbralMinutos = umbrales.umbrales.data?.gpsStaleAlertMinutes ?? 5;
  const lista = posiciones.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Mapa de la flota" description="Ubicación en vivo de los vehículos en ruta" />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="font-medium">Actualizaciones en vivo</span>
        <span className="inline-flex items-center gap-1.5" role="status" aria-live="polite">
          {connected ? <RadioTower className="size-4 text-emerald-600" aria-hidden /> : <Radio className="size-4 text-muted-foreground" aria-hidden />}
          {connected ? "Conectado" : "Reconectando…"}
        </span>
      </div>

      {errorPosiciones && <ErrorAlert error={posiciones.error} onRetry={() => posiciones.refetch()} isRetrying={posiciones.isFetching} />}
      {errorUmbral && <ErrorAlert error={umbrales.umbrales.error} title="No se pudo cargar el umbral de señal GPS" onRetry={() => umbrales.umbrales.refetch()} isRetrying={umbrales.umbrales.isFetching} />}
      {sinUmbral && !errorUmbral && !cargando && (
        <ErrorAlert title="Umbral de señal no disponible" description="No se puede clasificar la señal GPS hasta cargar los parámetros de alerta." />
      )}

      {cargando ? (
        <Skeleton className="h-[min(68vh,640px)] min-h-[360px] rounded-xl" aria-busy="true" />
      ) : errorPosiciones || errorUmbral || sinUmbral ? null : (
        <section className="min-w-0 rounded-xl border bg-card p-2 shadow-sm" aria-label="Mapa de ubicaciones">
          {lista.length === 0 && (
            <p className="mb-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground" role="status">
              No hay vehículos en rutas activas en este momento.
            </p>
          )}
          {lista.length > 0 && lista.every((p) => p.lastLatitude === null || p.lastLongitude === null) && (
            <p className="mb-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground" role="status">
              Las rutas están activas, pero todavía no han reportado una posición GPS.
            </p>
          )}
          <MapaPosicionesFlota posiciones={lista} umbralMinutos={umbralMinutos} rutaSeleccionada={null} ahora={ahora} />
          <p className="px-2 pt-2 text-xs text-muted-foreground">
            Mapa base © OpenStreetMap · Las ubicaciones se centran según los reportes GPS de las rutas activas.
          </p>
        </section>
      )}
    </div>
  );
}
