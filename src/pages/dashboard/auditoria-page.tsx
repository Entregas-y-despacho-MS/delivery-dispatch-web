import { Link } from "react-router-dom";
import { ScrollText, UserCog } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { PageHeader } from "@/shared/components/common/page-header";

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Auditoría" description="Consulta de actividad administrativa." />
      <EmptyState
        icon={<ScrollText className="size-6" aria-hidden />}
        title="Auditoría no está disponible todavía"
        description="Este portal aún no tiene conectada la consulta ni la exportación de registros de auditoría. No se mostrarán datos de ejemplo."
        action={(
          <Button asChild variant="outline">
            <Link to="/app/usuarios"><UserCog aria-hidden /> Ir a usuarios</Link>
          </Button>
        )}
      />
    </div>
  );
}
