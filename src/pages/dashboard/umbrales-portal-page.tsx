import { useMemo } from "react";
import { BellRing } from "lucide-react";

import {
  UmbralesForm,
  formularioAUmbrales,
  umbralesAFormulario,
  useUmbralesAlerta,
  type UmbralesFormValues,
} from "@/domains/configuracion";
import { PageHeader } from "@/shared/components/common/page-header";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";

const FORMATO_FECHA = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" });

/** Umbrales de alerta del supervisor (ST-67.2, RF-A16). */
export default function UmbralesPortalPage() {
  const { umbrales, guardar, guardando } = useUmbralesAlerta();
  const valores = useMemo(() => (umbrales.data ? umbralesAFormulario(umbrales.data) : undefined), [umbrales.data]);

  const onGuardar = (nuevos: UmbralesFormValues) => guardar(formularioAUmbrales(nuevos));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supervisión"
        title="Umbrales de alerta"
        icon={BellRing}
        description="Criterios para las alertas de desempeño de la flota."
      />

      {umbrales.isLoading ? (
        <div role="status" aria-label="Cargando umbrales">
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : umbrales.isError || !valores ? (
        <ErrorAlert
          error={umbrales.error}
          title="No pudimos cargar los umbrales"
          onRetry={() => umbrales.refetch()}
          isRetrying={umbrales.isFetching}
        />
      ) : (
        <>
          {umbrales.data?.updatedAt && (
            <p className="text-sm text-muted-foreground">
              Último cambio: {FORMATO_FECHA.format(new Date(umbrales.data.updatedAt))}
            </p>
          )}
          <UmbralesForm valores={valores} onGuardar={onGuardar} guardando={guardando} />
        </>
      )}
    </div>
  );
}
