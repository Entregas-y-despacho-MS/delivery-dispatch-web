import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ESTADOS_DESPACHO_CALIDAD, hayFiltrosCalidad, type FiltrosCalidad } from "../reportes.calidad";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export interface OpcionCatalogo {
  id: number;
  nombre: string;
}

function Campo({ id, etiqueta, children }: { id: string; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{etiqueta}</label>
      {children}
    </div>
  );
}

interface CalidadFiltrosProps {
  filtros: FiltrosCalidad;
  zonas: OpcionCatalogo[];
  motivosIncidencia: OpcionCatalogo[];
  onCambiar: (cambios: Partial<FiltrosCalidad>) => void;
  onLimpiar: () => void;
}

/** Zona, estado, motivo (de incidencia y de reclamo) y reprogramación (ST-300.3). Se combinan con Y. */
export function CalidadFiltros({ filtros, zonas, motivosIncidencia, onCambiar, onLimpiar }: CalidadFiltrosProps) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Campo id="calidad-zona" etiqueta="Zona">
          <select id="calidad-zona" className={CLASE_SELECT} value={filtros.zona ?? ""}
            onChange={(e) => onCambiar({ zona: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Todas</option>
            {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
        </Campo>
        <Campo id="calidad-estado" etiqueta="Estado del despacho">
          <select id="calidad-estado" className={CLASE_SELECT} value={filtros.estado ?? ""}
            onChange={(e) => onCambiar({ estado: e.target.value || null })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_DESPACHO_CALIDAD).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="calidad-incidencia" etiqueta="Motivo de incidencia">
          <select id="calidad-incidencia" className={CLASE_SELECT} value={filtros.motivoIncidencia ?? ""}
            onChange={(e) => onCambiar({ motivoIncidencia: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Todos</option>
            {motivosIncidencia.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </Campo>
        <Campo id="calidad-reclamo" etiqueta="Motivo de reclamo (CRM)">
          <Input id="calidad-reclamo" maxLength={64} placeholder="Ej.: DAMAGED_ITEM" value={filtros.motivoReclamo}
            onChange={(e) => onCambiar({ motivoReclamo: e.target.value })} />
        </Campo>
        <Campo id="calidad-reprogramado" etiqueta="Reprogramación">
          <select id="calidad-reprogramado" className={CLASE_SELECT} value={filtros.reprogramado === null ? "" : filtros.reprogramado ? "si" : "no"}
            onChange={(e) => onCambiar({ reprogramado: e.target.value === "" ? null : e.target.value === "si" })}>
            <option value="">Todos</option>
            <option value="si">Solo reprogramados</option>
            <option value="no">Sin reprogramar</option>
          </select>
        </Campo>
      </div>
      {hayFiltrosCalidad(filtros) && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onLimpiar}>Quitar filtros</Button>
        </div>
      )}
    </div>
  );
}
