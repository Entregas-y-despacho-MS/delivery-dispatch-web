import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/shared/lib/utils";
import { textoContador } from "../incidencias.alertas";
import { useContadorAlertas } from "../hooks/use-alertas-criticas";
import { useAlertasEnVivo } from "../hooks/use-alertas-en-vivo";

/**
 * Campana de la barra superior (ST-66.3): cuenta las alertas abiertas, escucha las nuevas por el
 * socket (toast) y lleva al centro de alertas del rol.
 */
export function CampanaAlertas({ hrefCentro, className }: { hrefCentro: string; className?: string }) {
  useAlertasEnVivo({ hrefCentro });
  const { total } = useContadorAlertas();
  const texto = textoContador(total);
  const etiqueta = total === 0 ? "Alertas: ninguna abierta" : `Alertas: ${total} abierta${total === 1 ? "" : "s"}`;

  return (
    <Link
      to={hrefCentro}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-lg text-sidebar-foreground outline-none hover:bg-sidebar-foreground/10 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
    >
      <Bell className="size-5" aria-hidden="true" />
      {texto && (
        <span
          data-testid="contador-alertas"
          className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-sidebar"
        >
          {texto}
        </span>
      )}
    </Link>
  );
}
