import { BellOff } from "lucide-react";

import { AsyncState } from "@/shared/components/feedback/async-state";
import { CardSkeletonList } from "@/shared/components/feedback/card-skeleton-list";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { FILTROS_ALERTAS_POR_DEFECTO, LIMITE_ALERTAS, TIPOS_ALERTA, hayFiltrosAlertas } from "../incidencias.alertas";
import type { FiltrosAlertas } from "../incidencias.types";
import { useAlertas, useAtenderAlerta } from "../hooks/use-alertas-criticas";
import { AlertaItem } from "./alerta-item";

/** Centro de alertas (ST-66.3): filtros por tipo y estado, la lista y «Marcar atendida». */
export function CentroAlertas() {
  const { filtros, setFiltros, alertas, incompleta, lista } = useAlertas();
  const { atender, atendiendoId } = useAtenderAlerta();
  const filtrado = hayFiltrosAlertas(filtros);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded-xl border bg-card p-4" role="group" aria-label="Filtros de alertas">
        <div className="grid w-full gap-1.5 sm:w-64">
          <Label htmlFor="filtro-tipo-alerta">Tipo</Label>
          <Select value={filtros.tipo} onValueChange={(tipo) => setFiltros({ ...filtros, tipo: tipo as FiltrosAlertas["tipo"] })}>
            <SelectTrigger id="filtro-tipo-alerta" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {TIPOS_ALERTA.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.etiqueta}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-full gap-1.5 sm:w-48">
          <Label htmlFor="filtro-estado-alerta">Estado</Label>
          <Select value={filtros.estado} onValueChange={(estado) => setFiltros({ ...filtros, estado: estado as FiltrosAlertas["estado"] })}>
            <SelectTrigger id="filtro-estado-alerta" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abiertas</SelectItem>
              <SelectItem value="acknowledged">Atendidas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AsyncState
        loading={lista.isPending}
        error={lista.isError ? lista.error : undefined}
        empty={alertas.length === 0}
        onRetry={() => lista.refetch()}
        loadingFallback={<div className="space-y-3" aria-busy="true"><CardSkeletonList count={3} /></div>}
        emptyFallback={filtrado ? (
          <NoResultsState
            bordered
            description="No hay alertas con este tipo y estado."
            onClearFilters={() => setFiltros(FILTROS_ALERTAS_POR_DEFECTO)}
          />
        ) : (
          <EmptyState
            icon={<BellOff className="size-6" aria-hidden />}
            title="Sin alertas abiertas"
            description="Todo en orden. Las nuevas aparecerán aquí y en la campana."
          />
        )}
      >
        {incompleta && (
          <p className="text-sm text-muted-foreground" role="status">
            Se muestran las {LIMITE_ALERTAS} alertas más recientes.
          </p>
        )}
        <ul className="space-y-3" aria-label="Alertas">
          {alertas.map((alerta) => (
            <AlertaItem key={alerta.id} alerta={alerta} onAtender={atender} atendiendo={atendiendoId === alerta.id} />
          ))}
        </ul>
      </AsyncState>
    </div>
  );
}
