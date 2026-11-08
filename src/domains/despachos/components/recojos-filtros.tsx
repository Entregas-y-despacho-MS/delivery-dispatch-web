import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { etiquetaEstadoDespacho } from "../despacho-detalle.format";
import { ESTADOS_RECOJO, ETIQUETA_ORIGEN, hayFiltrosRecojos, type FiltrosRecojos } from "../recojos.reglas";
import type { OrigenRecojo } from "../recojos.types";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface RecojosFiltrosProps {
  filtros: FiltrosRecojos;
  rangoInvertido: boolean;
  onEstadoChange: (estado: string | null) => void;
  onOrigenChange: (origen: OrigenRecojo | null) => void;
  onDesdeChange: (desde: string) => void;
  onHastaChange: (hasta: string) => void;
  onLimpiar: () => void;
}

/** Filtros del listado de recojos (ST-81.1): estado, origen y rango de la fecha preferida. */
export function RecojosFiltros({
  filtros,
  rangoInvertido,
  onEstadoChange,
  onOrigenChange,
  onDesdeChange,
  onHastaChange,
  onLimpiar,
}: RecojosFiltrosProps) {
  const describirRango = rangoInvertido ? "recojos-rango-error" : undefined;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="recojos-estado" className="text-xs font-medium text-muted-foreground">Estado</label>
          <select id="recojos-estado" className={CLASE_SELECT} value={filtros.estado ?? ""}
            onChange={(e) => onEstadoChange(e.target.value || null)}>
            <option value="">Todos</option>
            {ESTADOS_RECOJO.map((estado) => <option key={estado} value={estado}>{etiquetaEstadoDespacho(estado)}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="recojos-origen" className="text-xs font-medium text-muted-foreground">Origen</label>
          <select id="recojos-origen" className={CLASE_SELECT} value={filtros.origen ?? ""}
            onChange={(e) => onOrigenChange((e.target.value || null) as OrigenRecojo | null)}>
            <option value="">Todos</option>
            <option value="manual">{ETIQUETA_ORIGEN.manual}</option>
            <option value="rma">{ETIQUETA_ORIGEN.rma}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="recojos-desde" className="text-xs font-medium text-muted-foreground">Recojo desde</label>
          <Input id="recojos-desde" type="date" value={filtros.desde} max={filtros.hasta || undefined}
            onChange={(e) => onDesdeChange(e.target.value)} aria-invalid={rangoInvertido || undefined} aria-describedby={describirRango} />
        </div>
        <div className="space-y-1">
          <label htmlFor="recojos-hasta" className="text-xs font-medium text-muted-foreground">Recojo hasta</label>
          <Input id="recojos-hasta" type="date" value={filtros.hasta} min={filtros.desde || undefined}
            onChange={(e) => onHastaChange(e.target.value)} aria-invalid={rangoInvertido || undefined} aria-describedby={describirRango} />
        </div>
      </div>
      {rangoInvertido && (
        <p id="recojos-rango-error" role="alert" className="text-sm text-destructive">
          La fecha «Recojo desde» no puede ser posterior a «Recojo hasta».
        </p>
      )}
      {hayFiltrosRecojos(filtros) && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onLimpiar}>Quitar filtros</Button>
        </div>
      )}
    </div>
  );
}
