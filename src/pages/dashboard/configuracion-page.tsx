import { Link } from "react-router-dom";
import { Settings, UserCog } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { PageHeader } from "@/shared/components/common/page-header";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Ajustes generales del portal de administración." />
      <EmptyState
        icon={<Settings className="size-6" aria-hidden />}
        title="Los ajustes generales no están disponibles"
        description="Este portal todavía no ofrece ajustes generales para el Administrador. Los parámetros operativos y las alertas se administran desde las pantallas asignadas al Coordinador y al Supervisor."
        action={(
          <Button asChild variant="outline">
            <Link to="/app/usuarios"><UserCog aria-hidden /> Administrar usuarios</Link>
          </Button>
        )}
      />
    </div>
  );
}
