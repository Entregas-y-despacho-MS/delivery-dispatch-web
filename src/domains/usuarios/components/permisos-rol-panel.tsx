import { useId, useState } from "react";
import { ChevronDown, ShieldCheck, Smartphone } from "lucide-react";

import { NAV_GROUPS } from "@/app/navigation";
import { ROLE_BY_BACKEND_NAME, ROLES, ROLES_WEB } from "@/config/roles";
import { cn } from "@/shared/lib/utils";

interface PermisosRolPanelProps {
  /** roles.name del backend del rol elegido (coordinator, supervisor, driver…). undefined = ninguno elegido. */
  rolNombre: string | undefined;
}

/**
 * Muestra qué módulos del portal tendrá el usuario con el rol elegido, ANTES de guardar.
 * Sale de NAV_GROUPS, la misma fuente que arma el menú lateral: si un módulo cambia de roles allí,
 * este panel cambia solo y nunca queda desincronizado.
 */
export function PermisosRolPanel({ rolNombre }: PermisosRolPanelProps) {
  const [abierto, setAbierto] = useState(true);
  const contenidoId = useId();
  const rolId = rolNombre ? ROLE_BY_BACKEND_NAME[rolNombre] : undefined;

  if (rolNombre === undefined) return null;

  const grupos = NAV_GROUPS
    .map((grupo) => ({
      label: grupo.label,
      items: grupo.items.filter((item) => rolId !== undefined && (rolId === ROLES.ROOT || item.roles.includes(rolId))),
    }))
    .filter((grupo) => grupo.items.length > 0);
  const total = grupos.reduce((suma, grupo) => suma + grupo.items.length, 0);
  const entraAlPortal = rolId !== undefined && (ROLES_WEB as readonly number[]).includes(rolId);

  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls={contenidoId}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
          Módulos a los que tendrá acceso
          {entraAlPortal && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary tabular-nums">{total}</span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", abierto && "rotate-180")} aria-hidden />
      </button>

      {abierto && (
        <div id={contenidoId} className="border-t px-3 py-3">
          {rolId === ROLES.REPARTIDOR ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Usa la app móvil de reparto: no ingresa al portal web.
            </p>
          ) : !entraAlPortal ? (
            <p className="text-sm text-muted-foreground">
              Rol de sistema del backend: por ahora no tiene pantallas propias en el portal web.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {grupos.map((grupo) => (
                <div key={grupo.label} className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{grupo.label}</p>
                  <ul className="space-y-1">
                    {grupo.items.map((item) => (
                      <li key={item.href} className="flex items-center gap-2 text-sm">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
