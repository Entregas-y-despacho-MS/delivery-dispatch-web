import { SlidersHorizontal } from "lucide-react";

import { ParametrosForm, useParametrosOperativos } from "@/domains/configuracion";
import { PageHeader } from "@/shared/components/common/page-header";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";

/** Parámetros operativos del coordinador (ST-57.1, RF-A10). */
export default function ParametrosPage() {
  const { parametros, valores, ventanaGeneral, estados, clavesSinDefinir, guardar, guardando } = useParametrosOperativos();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Parámetros operativos"
        icon={SlidersHorizontal}
        description="Ventanas de entrega, plazos, horas de corte y reintentos. Los cambios se aplican sin un nuevo despliegue."
      />

      {parametros.isLoading ? (
        <div role="status" aria-label="Cargando parámetros" className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : parametros.isError ? (
        <ErrorAlert
          error={parametros.error}
          title="No pudimos cargar los parámetros"
          onRetry={() => parametros.refetch()}
          isRetrying={parametros.isFetching}
        />
      ) : (
        <ParametrosForm
          valores={valores}
          estados={estados}
          clavesSinDefinir={clavesSinDefinir}
          ventanaGeneral={ventanaGeneral}
          onGuardar={guardar}
          guardando={guardando}
        />
      )}
    </div>
  );
}
