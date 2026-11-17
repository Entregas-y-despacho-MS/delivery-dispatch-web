import { BellRing } from "lucide-react";

import { CentroAlertas } from "@/domains/incidencias";
import { PageHeader } from "@/shared/components/common/page-header";

/** Centro de alertas del supervisor (ST-66.3, RF-A19). */
export default function AlertasPortalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={BellRing}
        title="Alertas operativas"
        description="Incidencias críticas, vehículos sin señal y desvíos de desempeño de la flota"
      />
      <CentroAlertas />
    </div>
  );
}
