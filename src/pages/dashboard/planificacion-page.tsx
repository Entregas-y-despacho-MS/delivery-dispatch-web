import { useMemo, useState } from "react";
import { Boxes, RefreshCw, Route } from "lucide-react";

import { useParametrosOperativos } from "@/domains/configuracion";
import { useVehiculos } from "@/domains/flota";
import {
  LoteDefinitivoDetalle,
  LoteProvisionalDetalle,
  LoteResumenCard,
  useLotes,
  type OpcionConductor,
  type OpcionRevisor,
  type OpcionVehiculo,
} from "@/domains/planificacion";
import { useUsuarios } from "@/domains/usuarios";
import { PageHeader } from "@/shared/components/common/page-header";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useAuthStore } from "@/shared/store/use-auth-store";

type FiltroRevisor = "todos" | "mios" | "sin-revisor";
/** 1.ª aprobación: lotes provisionales (ST-215.1). 2.ª: lotes en revisión final (ST-51.1). */
type Etapa = "provisional" | "pending_final_review";

const VEHICULOS_PARAMS = { page: 1, limit: 100 };
const USUARIOS_PARAMS = { page: 1, limit: 100, status: "active" as const };
const ROLES_REVISORES: Record<string, string> = { coordinator: "Coordinador", supervisor: "Supervisor" };

/**
 * Revisión de lotes: 1.ª aprobación de promesas (ST-215.1, RF-A04) y
 * 2.ª aprobación del lote definitivo (ST-51.1, RF-A05).
 */
export default function PlanificacionPage() {
  const usuarioId = Number(useAuthStore((estado) => estado.user?.id)) || null;
  const [etapa, setEtapa] = useState<Etapa>("provisional");
  const [filtro, setFiltro] = useState<FiltroRevisor>("todos");
  const [loteId, setLoteId] = useState<number | null>(null);
  const esFinal = etapa === "pending_final_review";

  const params = useMemo(() => ({
    page: 1,
    limit: 50,
    status: etapa,
    ...(filtro === "mios" && usuarioId ? { reviewerUserId: usuarioId } : {}),
    ...(filtro === "sin-revisor" ? { withoutReviewer: true } : {}),
  }), [etapa, filtro, usuarioId]);
  const lotes = useLotes(params);

  const vehiculos = useVehiculos(VEHICULOS_PARAMS);
  const opcionesVehiculo = useMemo<OpcionVehiculo[]>(() => vehiculos.data
    .filter((v) => v.vehicleStatus.name === "active")
    .map((v) => ({ id: v.id, etiqueta: `${v.plate} · ${v.model}`, capacidadKg: v.capacityKg, capacidadM3: v.capacityM3 })), [vehiculos.data]);

  const usuarios = useUsuarios(USUARIOS_PARAMS);
  const revisores = useMemo<OpcionRevisor[]>(() => (usuarios.data?.items ?? [])
    .filter((u) => u.activo && ROLES_REVISORES[u.rol.nombre])
    .map((u) => ({ id: u.id, nombre: u.nombreCompleto, rol: ROLES_REVISORES[u.rol.nombre] })), [usuarios.data]);
  const conductores = useMemo<OpcionConductor[]>(() => (usuarios.data?.items ?? [])
    .filter((u) => u.activo && u.rol.nombre === "driver")
    .map((u) => ({ id: u.id, nombre: u.nombreCompleto })), [usuarios.data]);

  const { valores } = useParametrosOperativos();
  const horasRevision = useMemo(() => ({
    finRevision: valores.final_review_end_time,
    escalamiento: valores.final_review_escalation_time,
  }), [valores]);

  const items = lotes.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Planificación"
        icon={Route}
        description="Lotes que armó el sistema. Primero apruebas las promesas al cliente; después del corte apruebas el lote definitivo con su vehículo y conductor."
      />

      <Tabs value={etapa} onValueChange={(valor) => { setEtapa(valor as Etapa); setLoteId(null); }}>
        <TabsList>
          <TabsTrigger value="provisional">1.ª aprobación · promesas</TabsTrigger>
          <TabsTrigger value="pending_final_review">2.ª aprobación · lote definitivo</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="grid gap-4 lg:grid-cols-[minmax(18rem,22rem)_1fr]" aria-label={esFinal ? "Lotes en revisión final" : "Lotes provisionales"}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={filtro} onValueChange={(valor: FiltroRevisor) => { setFiltro(valor); setLoteId(null); }}>
              <SelectTrigger className="h-9 flex-1" aria-label="Filtrar lotes por revisor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{esFinal ? "Todos en revisión final" : "Todos los provisionales"}</SelectItem>
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
              No hay lotes {esFinal ? "en revisión final" : "provisionales"} {filtro === "mios" ? "asignados a ti" : filtro === "sin-revisor" ? "sin revisor" : "por revisar"}.
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
              onSeleccionar={() => setLoteId(lote.id)}
            />
          ))}
        </div>

        <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          {loteId === null
            ? <p className="py-10 text-center text-sm text-muted-foreground">Elige un lote de la lista para revisarlo.</p>
            : esFinal ? (
              <LoteDefinitivoDetalle
                key={loteId}
                loteId={loteId}
                vehiculos={opcionesVehiculo}
                conductores={conductores}
                horasRevision={horasRevision}
                onCerrar={() => setLoteId(null)}
              />
            ) : (
              <LoteProvisionalDetalle
                key={loteId}
                loteId={loteId}
                usuarioId={usuarioId}
                vehiculos={opcionesVehiculo}
                revisores={revisores}
                onCerrar={() => setLoteId(null)}
              />
            )}
        </div>
      </section>
    </div>
  );
}
