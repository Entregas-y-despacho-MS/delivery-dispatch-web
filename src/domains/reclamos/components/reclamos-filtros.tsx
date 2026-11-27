import { RotateCw } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  ESTADOS_RECLAMO,
  MENSAJE_PROBLEMA_RECLAMOS,
  hayFiltrosReclamos,
  type FiltrosReclamos,
  type ProblemaFiltrosReclamos,
} from "../reclamos.reglas";
import type { EstadoReclamo } from "../types/reclamos.types";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export interface ZonaOpcion {
  id: number;
  name: string;
}

interface ReclamosFiltrosProps {
  filtros: FiltrosReclamos;
  problema: ProblemaFiltrosReclamos | null;
  zonas: ZonaOpcion[];
  /** ID del usuario en sesión, para «Solo mis casos». */
  miId: number | null;
  onCambiar: (cambios: Partial<FiltrosReclamos>) => void;
  onLimpiar: () => void;
  onRefrescar: () => void;
  refrescando?: boolean;
}

function Campo({ id, etiqueta, children }: { id: string; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{etiqueta}</label>
      {children}
    </div>
  );
}

/** Filtros de la bandeja (ST-45.3): fecha de recepción, zona, motivo, estado y responsable. Se combinan con Y. */
export function ReclamosFiltros({ filtros, problema, zonas, miId, onCambiar, onLimpiar, onRefrescar, refrescando = false }: ReclamosFiltrosProps) {
  const rangoMal = problema === "rango-invertido";
  const soloMios = miId !== null && filtros.responsable === miId;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Campo id="reclamos-desde" etiqueta="Recibido desde">
          <Input id="reclamos-desde" type="date" value={filtros.desde} max={filtros.hasta || undefined}
            aria-invalid={rangoMal || undefined} aria-describedby={rangoMal ? "reclamos-problema" : undefined}
            onChange={(e) => onCambiar({ desde: e.target.value })} />
        </Campo>
        <Campo id="reclamos-hasta" etiqueta="Hasta (incluido)">
          <Input id="reclamos-hasta" type="date" value={filtros.hasta} min={filtros.desde || undefined}
            aria-invalid={rangoMal || undefined} aria-describedby={rangoMal ? "reclamos-problema" : undefined}
            onChange={(e) => onCambiar({ hasta: e.target.value })} />
        </Campo>
        <Campo id="reclamos-estado" etiqueta="Estado">
          <select id="reclamos-estado" className={CLASE_SELECT} value={filtros.estado ?? ""}
            onChange={(e) => onCambiar({ estado: (e.target.value || null) as EstadoReclamo | null })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_RECLAMO).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="reclamos-zona" etiqueta="Zona">
          <select id="reclamos-zona" className={CLASE_SELECT} value={filtros.zona ?? ""}
            onChange={(e) => onCambiar({ zona: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Todas</option>
            {zonas.map((zona) => <option key={zona.id} value={zona.id}>{zona.name}</option>)}
          </select>
        </Campo>
        <Campo id="reclamos-motivo" etiqueta="Motivo (código del CRM)">
          <Input id="reclamos-motivo" placeholder="Ej.: DAMAGED_ITEM" maxLength={64} value={filtros.motivo}
            onChange={(e) => onCambiar({ motivo: e.target.value })} />
        </Campo>
      </div>

      {rangoMal && <p id="reclamos-problema" role="alert" className="text-sm text-destructive">{MENSAJE_PROBLEMA_RECLAMOS[problema]}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-primary" checked={soloMios} disabled={miId === null}
            onChange={(e) => onCambiar({ responsable: e.target.checked ? miId : null })} />
          Solo mis casos
        </label>
        <div className="flex gap-2">
          {hayFiltrosReclamos(filtros) && <Button type="button" variant="ghost" size="sm" onClick={onLimpiar}>Quitar filtros</Button>}
          <Button type="button" variant="outline" size="sm" onClick={onRefrescar} disabled={refrescando}>
            <RotateCw className={refrescando ? "animate-spin" : undefined} aria-hidden /> Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
