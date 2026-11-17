import { useId, useState } from "react";
import { ChevronDown, ShieldCheck, Smartphone } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { PERMISOS_POR_ROL } from "../permisos-por-rol";

interface PermisosRolPanelProps {
  /** Nombre estable del rol devuelto por la API. */
  rolNombre: string | undefined;
}

/** Muestra el alcance del rol elegido antes de confirmar su asignación. */
export function PermisosRolPanel({ rolNombre }: PermisosRolPanelProps) {
  const [abierto, setAbierto] = useState(true);
  const contenidoId = useId();

  if (!rolNombre) return null;
  const permisos = PERMISOS_POR_ROL[rolNombre];

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
          Permisos del rol
          {permisos && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary tabular-nums">
              {permisos.length}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", abierto && "rotate-180")} aria-hidden />
      </button>

      {abierto && (
        <div id={contenidoId} className="space-y-3 border-t px-3 py-3">
          {rolNombre === "driver" && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              El repartidor usa la app móvil y no ingresa al portal web.
            </p>
          )}
          {permisos ? (
            <ul className="divide-y divide-border">
              {permisos.map(({ modulo, acciones }) => (
                <li key={modulo} className="grid gap-0.5 py-2 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] sm:gap-3">
                  <span className="text-sm font-medium">{modulo}</span>
                  <span className="text-sm text-muted-foreground">{acciones}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No hay información de permisos para este rol.</p>
          )}
        </div>
      )}
    </div>
  );
}
