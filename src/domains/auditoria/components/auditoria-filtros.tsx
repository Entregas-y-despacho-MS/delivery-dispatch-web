import { RotateCw } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import {
  ACCIONES_AUDITORIA,
  CODIGOS_ACCION,
  ENTIDADES_AUDITORIA,
  MENSAJE_PROBLEMA_AUDITORIA,
  RESULTADOS_AUDITORIA,
  ROLES_AUDITORIA,
  hayFiltrosAuditoria,
  type AccionAuditoria,
  type FiltrosAuditoria,
  type ProblemaFiltrosAuditoria,
} from "../auditoria.reglas";
import type { OrdenAuditoria, ResultadoAuditoria } from "../types/auditoria.types";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface AuditoriaFiltrosProps {
  filtros: FiltrosAuditoria;
  problema: ProblemaFiltrosAuditoria | null;
  onCambiar: (cambios: Partial<FiltrosAuditoria>) => void;
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

/** Filtros combinables de la auditoría (ST-70.2): fecha, actor, rol, acción, entidad, resultado y correlación. */
export function AuditoriaFiltros({ filtros, problema, onCambiar, onLimpiar, onRefrescar, refrescando = false }: AuditoriaFiltrosProps) {
  const rangoMal = problema === "rango-invertido" || problema === "rango-largo";
  const describir = (activo: boolean) => (activo ? "auditoria-problema" : undefined);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo id="auditoria-desde" etiqueta="Desde (hora de Bolivia)">
          <Input id="auditoria-desde" type="date" value={filtros.desde} max={filtros.hasta}
            aria-invalid={rangoMal || undefined} aria-describedby={describir(rangoMal)}
            onChange={(e) => e.target.value && onCambiar({ desde: e.target.value })} />
        </Campo>
        <Campo id="auditoria-hasta" etiqueta="Hasta (incluido)">
          <Input id="auditoria-hasta" type="date" value={filtros.hasta} min={filtros.desde}
            aria-invalid={rangoMal || undefined} aria-describedby={describir(rangoMal)}
            onChange={(e) => e.target.value && onCambiar({ hasta: e.target.value })} />
        </Campo>
        <Campo id="auditoria-accion" etiqueta="Acción">
          <select id="auditoria-accion" className={CLASE_SELECT} value={filtros.accion ?? ""}
            onChange={(e) => onCambiar({ accion: (e.target.value || null) as AccionAuditoria | null })}>
            <option value="">Todas</option>
            {CODIGOS_ACCION.map((codigo) => <option key={codigo} value={codigo}>{ACCIONES_AUDITORIA[codigo].etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="auditoria-resultado" etiqueta="Resultado">
          <select id="auditoria-resultado" className={CLASE_SELECT} value={filtros.resultado ?? ""}
            onChange={(e) => onCambiar({ resultado: (e.target.value || null) as ResultadoAuditoria | null })}>
            <option value="">Todos</option>
            {Object.entries(RESULTADOS_AUDITORIA).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="auditoria-actor" etiqueta="ID del actor">
          <Input id="auditoria-actor" inputMode="numeric" placeholder="Ej.: 4" value={filtros.actorId ?? ""}
            onChange={(e) => {
              const valor = e.target.value.trim();
              if (valor === "" || /^\d+$/.test(valor)) onCambiar({ actorId: valor ? Number(valor) : null });
            }} />
        </Campo>
        <Campo id="auditoria-rol" etiqueta="Rol del actor">
          <select id="auditoria-rol" className={CLASE_SELECT} value={filtros.rol ?? ""}
            onChange={(e) => onCambiar({ rol: e.target.value || null })}>
            <option value="">Todos</option>
            {Object.entries(ROLES_AUDITORIA).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="auditoria-entidad" etiqueta="Entidad">
          <select id="auditoria-entidad" className={CLASE_SELECT} value={filtros.entidad ?? ""}
            onChange={(e) => onCambiar({ entidad: e.target.value || null, ...(e.target.value ? {} : { idEntidad: "" }) })}>
            <option value="">Todas</option>
            {Object.entries(ENTIDADES_AUDITORIA).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="auditoria-id-entidad" etiqueta="ID de la entidad">
          <Input id="auditoria-id-entidad" maxLength={64} placeholder={filtros.entidad ? "Ej.: 12" : "Elige la entidad primero"}
            disabled={!filtros.entidad} value={filtros.idEntidad}
            aria-invalid={problema === "id-sin-entidad" || undefined} aria-describedby={describir(problema === "id-sin-entidad")}
            onChange={(e) => onCambiar({ idEntidad: e.target.value.replace(/\s/g, "") })} />
        </Campo>
        <Campo id="auditoria-correlacion" etiqueta="Correlación (X-Request-Id)">
          <Input id="auditoria-correlacion" maxLength={64} value={filtros.correlacion}
            aria-invalid={problema === "correlacion-invalida" || undefined} aria-describedby={describir(problema === "correlacion-invalida")}
            onChange={(e) => onCambiar({ correlacion: e.target.value.trim() })} />
        </Campo>
        <Campo id="auditoria-orden" etiqueta="Orden">
          <select id="auditoria-orden" className={CLASE_SELECT} value={filtros.orden}
            onChange={(e) => onCambiar({ orden: e.target.value as OrdenAuditoria })}>
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguos primero</option>
          </select>
        </Campo>
      </div>
      {problema && (
        <p id="auditoria-problema" role="alert" className="text-sm text-destructive">{MENSAJE_PROBLEMA_AUDITORIA[problema]}</p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {hayFiltrosAuditoria(filtros) && (
          <Button type="button" variant="ghost" onClick={onLimpiar}>Quitar filtros</Button>
        )}
        <Button type="button" variant="outline" onClick={onRefrescar} disabled={refrescando || problema !== null}>
          <RotateCw className={cn("size-4", refrescando && "animate-spin")} aria-hidden />
          {refrescando ? "Actualizando…" : "Actualizar"}
        </Button>
      </div>
    </div>
  );
}
