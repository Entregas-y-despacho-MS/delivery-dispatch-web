import { Settings } from "lucide-react";

import { ROLES, hasRole } from "@/config/roles";
import { SeguridadForm, useConfiguracionSeguridad } from "@/domains/configuracion";
import { PageHeader } from "@/shared/components/common/page-header";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { ParametrosPanel } from "./parametros-page";
import { UmbralesPanel } from "./umbrales-portal-page";

function SeguridadPanel() {
  const { parametros, valores, guardar, guardando } = useConfiguracionSeguridad();
  if (parametros.isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (parametros.isError) return <ErrorAlert error={parametros.error} title="No se pudo cargar la política"
    onRetry={() => parametros.refetch()} isRetrying={parametros.isFetching} />;
  if (!valores) return <p role="alert">Faltan claves de seguridad en el servidor. Revisa la migración de configuración.</p>;
  return <SeguridadForm valores={valores} onGuardar={guardar} guardando={guardando} />;
}

/** Cada grupo monta únicamente su consulta y edición autorizadas por el servicio. */
export default function ConfiguracionPage() {
  const roleId = useAuthStore((state) => state.user?.rol.id);
  return <div className="space-y-6">
    <PageHeader title="Configuración" icon={Settings}
      description="Consulta y cambia los parámetros permitidos para tu rol." />
    {hasRole(roleId, [ROLES.ADMIN]) && <SeguridadPanel />}
    {hasRole(roleId, [ROLES.COORDINADOR]) && <ParametrosPanel />}
    {hasRole(roleId, [ROLES.SUPERVISOR]) && <UmbralesPanel />}
  </div>;
}
