import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes, RefreshCw, Route } from "lucide-react";

import { useVehiculos } from "@/domains/flota";
import {
  LoteProvisionalDetalle,
  LoteAprobacionFinal,
  LoteResumenCard,
  useLotes,
  type OpcionRevisor,
  type OpcionVehiculo,
} from "@/domains/planificacion";
import { useUsuarios } from "@/domains/usuarios";
import { useParametrosOperativos } from "@/domains/configuracion";
import { PageHeader } from "@/shared/components/common/page-header";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuthStore } from "@/shared/store/use-auth-store";

type FiltroRevisor = "todos" | "mios" | "sin-revisor";

const VEHICULOS_PARAMS = { page: 1, limit: 100 };
const USUARIOS_PARAMS = { page: 1, limit: 100, status: "active" as const };
const ROLES_REVISORES: Record<string, string> = { coordinator: "Coordinador", supervisor: "Supervisor" };

/** Revisión de lotes provisionales y 1.ª aprobación de promesas (ST-215.1, RF-A04). */
export default function PlanificacionPage() {
  const usuarioId = Number(useAuthStore((estado) => estado.user?.id)) || null;
  const [filtro, setFiltro] = useState<FiltroRevisor>("todos");
  const [searchParams, setSearchParams] = useSearchParams();
  const loteParam = Number(searchParams.get("loteId"));
  const loteId = Number.isSafeInteger(loteParam) && loteParam > 0 ? loteParam : null;
  const accionVehiculoSolicitada = searchParams.get("accion") === "cambiar-vehiculo";
  const seleccionarLote = (id: number | null) => {
    setSearchParams((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      if (id === null) siguientes.delete("loteId");
      else siguientes.set("loteId", String(id));
      return siguientes;
    }, { replace: true });
  };
  const consumirAccionVehiculo = useCallback(() => {
    setSearchParams((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      siguientes.delete("accion");
      return siguientes;
    }, { replace: true });
  }, [setSearchParams]);
  const loteFinalParam = Number(searchParams.get("loteFinalId"));
  const loteFinalId = Number.isSafeInteger(loteFinalParam) && loteFinalParam > 0 ? loteFinalParam : null;
  const seleccionarLoteFinal = (id: number | null) => {
    setSearchParams((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      if (id === null) siguientes.delete("loteFinalId");
      else siguientes.set("loteFinalId", String(id));
      return siguientes;
    }, { replace: true });
  };

  const params = useMemo(() => ({
    page: 1,
    limit: 50,
    status: "provisional" as const,
    ...(filtro === "mios" && usuarioId ? { reviewerUserId: usuarioId } : {}),
    ...(filtro === "sin-revisor" ? { withoutReviewer: true } : {}),
  }), [filtro, usuarioId]);
  const lotes = useLotes(params);
  const lotesFinales = useLotes({ page: 1, limit: 50, status: "pending_final_review" });

  const vehiculos = useVehiculos(VEHICULOS_PARAMS);
  const opcionesVehiculo = useMemo<OpcionVehiculo[]>(() => vehiculos.data
    .filter((v) => v.vehicleStatus.name === "active")
    .map((v) => ({ id: v.id, etiqueta: `${v.plate} · ${v.model}`, capacidadKg: v.capacityKg, capacidadM3: v.capacityM3 })), [vehiculos.data]);

  const usuarios = useUsuarios(USUARIOS_PARAMS);
  const revisores = useMemo<OpcionRevisor[]>(() => (usuarios.data?.items ?? [])
    .filter((u) => u.activo && ROLES_REVISORES[u.rol.nombre])
    .map((u) => ({ id: u.id, nombre: u.nombreCompleto, rol: ROLES_REVISORES[u.rol.nombre] })), [usuarios.data]);
  const conductores = useMemo<OpcionRevisor[]>(() => (usuarios.data?.items ?? [])
    .filter((u) => u.activo && u.rol.nombre === "driver")
    .map((u) => ({ id: u.id, nombre: u.nombreCompleto, rol: "Repartidor" })), [usuarios.data]);

  const items = lotes.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Planificación"
        icon={Route}
        description="Revisa los lotes provisionales y abre un lote confirmado desde Flota para reemplazar su vehículo."
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(18rem,22rem)_1fr]" aria-label="Lotes provisionales">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={filtro} onValueChange={(valor: FiltroRevisor) => { setFiltro(valor); seleccionarLote(null); }}>
              <SelectTrigger className="h-9 flex-1" aria-label="Filtrar lotes por revisor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los provisionales</SelectItem>
                <SelectItem value="mios">Asignados a mí</SelectItem>
                <SelectItem value="sin-revisor">Sin revisor</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" size="icon" variant="outline" onClick={() => void lotes.refetch()} disabled={lotes.isFetching} aria-label="Actualizar lotes">
              <RefreshCw className={lotes.isFetching ? "animate-spin" : undefined} aria-hidden />
            </Button>
          </div>

          {lotes.isLoading && <><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></>}
          {lotes.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">No se pudieron cargar los lotes.</p>
          )}
          {!lotes.isLoading && !lotes.isError && items.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              <Boxes className="size-6" aria-hidden />
              No hay lotes provisionales {filtro === "mios" ? "asignados a ti" : filtro === "sin-revisor" ? "sin revisor" : "por revisar"}.
            </div>
          )}
          {items.map((lote) => (
            <LoteResumenCard
              key={lote.id}
              titulo={`Lote #${lote.id}`}
              zona={lote.zone?.name ?? null}
              fecha={lote.shiftDate}
              vehiculo={lote.vehicle?.plate ?? null}
              cantidadPedidos={lote.dispatchCount}
              ocupacion={lote.occupancy ? Math.max(lote.occupancy.weight.usedPercent, lote.occupancy.volume.usedPercent) : null}
              revisor={lote.reviewer?.fullName ?? null}
              seleccionado={lote.id === loteId}
              onSeleccionar={() => seleccionarLote(lote.id)}
            />
          ))}
        </div>

        <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          {loteId === null
            ? <p className="py-10 text-center text-sm text-muted-foreground">Elige un lote de la lista para revisarlo.</p>
            : (
              <LoteProvisionalDetalle
                key={loteId}
                loteId={loteId}
                usuarioId={usuarioId}
                vehiculos={opcionesVehiculo}
                revisores={revisores}
                accionVehiculoSolicitada={accionVehiculoSolicitada}
                onAccionVehiculoConsumida={consumirAccionVehiculo}
                onCerrar={() => seleccionarLote(null)}
              />
            )}
        </div>
      </section>

      <section className="space-y-4 border-t pt-6" aria-label="Lotes para aprobación final">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Aprobación final</h2><p className="text-sm text-muted-foreground">Revisa los lotes validados antes de confirmar conductor, vehículo y pedidos.</p></div>
          <Button type="button" size="icon" variant="outline" onClick={() => void lotesFinales.refetch()} disabled={lotesFinales.isFetching} aria-label="Actualizar lotes para aprobación final"><RefreshCw className={lotesFinales.isFetching ? "animate-spin" : undefined} aria-hidden /></Button>
        </div>
        {lotesFinales.isLoading && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>}
        {lotesFinales.isError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">No se pudieron cargar los lotes de aprobación final.</p>}
        {!lotesFinales.isLoading && !lotesFinales.isError && (lotesFinales.data?.items.length ?? 0) === 0 && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No hay lotes esperando aprobación final.</p>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(lotesFinales.data?.items ?? []).map((lote) => <LoteResumenCard key={lote.id} titulo={`Lote #${lote.id} · Revisión final`} zona={lote.zone?.name ?? null} fecha={lote.shiftDate} vehiculo={lote.vehicle?.plate ?? null} cantidadPedidos={lote.dispatchCount} ocupacion={lote.occupancy ? Math.max(lote.occupancy.weight.usedPercent, lote.occupancy.volume.usedPercent) : null} revisor={lote.reviewer?.fullName ?? null} seleccionado={lote.id === loteFinalId} onSeleccionar={() => seleccionarLoteFinal(lote.id)} />)}
        </div>
        {loteFinalId !== null && <LoteAprobacionFinalConParametros key={loteFinalId} loteId={loteFinalId} vehiculos={opcionesVehiculo} conductores={conductores} onCerrar={() => seleccionarLoteFinal(null)} />}
      </section>
    </div>
  );
}

function LoteAprobacionFinalConParametros(props: {
  loteId: number;
  vehiculos: OpcionVehiculo[];
  conductores: OpcionRevisor[];
  onCerrar: () => void;
}) {
  const parametros = useParametrosOperativos();
  return (
    <LoteAprobacionFinal
      {...props}
      horariosRevision={{
        final_review_end_time: parametros.valores.final_review_end_time,
        final_review_escalation_time: parametros.valores.final_review_escalation_time,
      }}
    />
  );
}
