import { useMemo, useState } from "react";
import { Boxes, RefreshCw, Route } from "lucide-react";

import { useVehiculos } from "@/domains/flota";
import {
  LoteProvisionalDetalle,
  LoteResumenCard,
  useLotes,
  type OpcionRevisor,
  type OpcionVehiculo,
} from "@/domains/planificacion";
import { useUsuarios } from "@/domains/usuarios";
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
  const [loteId, setLoteId] = useState<number | null>(null);

  const params = useMemo(() => ({
    page: 1,
    limit: 50,
    status: "provisional" as const,
    ...(filtro === "mios" && usuarioId ? { reviewerUserId: usuarioId } : {}),
    ...(filtro === "sin-revisor" ? { withoutReviewer: true } : {}),
  }), [filtro, usuarioId]);
  const lotes = useLotes(params);

  const vehiculos = useVehiculos(VEHICULOS_PARAMS);
  const opcionesVehiculo = useMemo<OpcionVehiculo[]>(() => vehiculos.data
    .filter((v) => v.vehicleStatus.name === "active")
    .map((v) => ({ id: v.id, etiqueta: `${v.plate} · ${v.model}`, capacidadKg: v.capacityKg, capacidadM3: v.capacityM3 })), [vehiculos.data]);

  const usuarios = useUsuarios(USUARIOS_PARAMS);
  const revisores = useMemo<OpcionRevisor[]>(() => (usuarios.data?.items ?? [])
    .filter((u) => u.activo && ROLES_REVISORES[u.rol.nombre])
    .map((u) => ({ id: u.id, nombre: u.nombreCompleto, rol: ROLES_REVISORES[u.rol.nombre] })), [usuarios.data]);

  const items = lotes.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Planificación"
        icon={Route}
        description="Lotes provisionales que armó el sistema. Revisa los pedidos y aprueba las promesas antes de que el cliente reciba su fecha."
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(18rem,22rem)_1fr]" aria-label="Lotes provisionales">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={filtro} onValueChange={(valor: FiltroRevisor) => { setFiltro(valor); setLoteId(null); }}>
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
              onSeleccionar={() => setLoteId(lote.id)}
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
                onCerrar={() => setLoteId(null)}
              />
            )}
        </div>
      </section>
    </div>
  );
}
