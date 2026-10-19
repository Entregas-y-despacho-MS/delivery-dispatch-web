import { useState } from "react";
import { AlertTriangle, CheckCheck, RefreshCw, Truck, UserRoundCog } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAccionesLote } from "../hooks/use-acciones-lote";
import { useLote } from "../hooks/use-lotes";
import type { PedidoLote } from "../lotes.types";
import { formatearFechaTurno } from "../planificacion.format";
import { AprobarPromesasDialog } from "./aprobar-promesas-dialog";
import { CambiarVehiculoDialog, type OpcionVehiculo } from "./cambiar-vehiculo-dialog";
import { LotePedidosTable } from "./lote-pedidos-table";
import { OcupacionLote } from "./ocupacion-lote";
import { ReasignarLoteDialog, type OpcionRevisor } from "./reasignar-lote-dialog";
import { SacarPedidoDialog } from "./sacar-pedido-dialog";

interface LoteProvisionalDetalleProps {
  loteId: number;
  /** Id del coordinador con sesión: solo el revisor asignado (o cualquiera si no hay) puede aprobar. */
  usuarioId: number | null;
  vehiculos: OpcionVehiculo[];
  revisores: OpcionRevisor[];
  /** El lote dejó de existir o de estar provisional: la página vuelve a la lista. */
  onCerrar: () => void;
}

/**
 * Detalle del lote provisional y 1.ª aprobación (ST-215.1): pedidos con su franja propuesta,
 * ocupación del vehículo, sacar pedidos, cambiar vehículo, reasignar y aprobar las promesas.
 */
export function LoteProvisionalDetalle({ loteId, usuarioId, vehiculos, revisores, onCerrar }: LoteProvisionalDetalleProps) {
  const lote = useLote(loteId);
  const [sacados, setSacados] = useState<ReadonlySet<number>>(new Set());
  const [aSacar, setASacar] = useState<PedidoLote | null>(null);
  const [dialogo, setDialogo] = useState<"aprobar" | "vehiculo" | "revisor" | null>(null);
  const acciones = useAccionesLote({
    alRecargar: () => {
      // El lote vigente es otro: lo marcado para sacar ya no aplica.
      setSacados(new Set());
      setDialogo(null);
      void lote.refetch().then(({ data }) => { if (!data || data.status !== "provisional") onCerrar(); });
    },
  });

  if (lote.isLoading) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }
  if (lote.isError || !lote.data) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p>No se pudo cargar el lote.</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void lote.refetch()}>
          <RefreshCw aria-hidden /> Reintentar
        </Button>
      </div>
    );
  }

  const datos = lote.data;
  const esMio = datos.reviewer === null || datos.reviewer.id === usuarioId;
  const puedeOperar = datos.status === "provisional" && esMio && !acciones.ocupado;
  const puedeEditarPedidos = puedeOperar && !datos.dispatches.every((p) => p.status !== "in_planning");
  const aprobados = datos.dispatches.filter((p) => !sacados.has(p.dispatchId));
  // 1.ª aprobación hecha: los pedidos ya están programados y el lote espera el corte de D-1.
  const yaAprobado = datos.dispatches.length > 0 && datos.dispatches.every((p) => p.status !== "in_planning");
  const sacadosLista = datos.dispatches.filter((p) => sacados.has(p.dispatchId));
  const motivoBloqueo = yaAprobado
    ? "Las promesas de este lote ya están aprobadas. Queda esperar el corte del día anterior para la aprobación final."
    : !datos.vehicle
    ? "Asigna un vehículo antes de aprobar."
    : aprobados.length === 0
      ? "Debe quedar al menos un pedido en el lote."
      : datos.capacity && !datos.capacity.assignable
        ? "La carga no entra en el vehículo: cambia de vehículo o saca pedidos."
        : null;

  const aprobar = () => acciones.aprobarPromesas(
    {
      loteId: datos.id,
      payload: {
        version: datos.version,
        dispatches: datos.dispatches.map((p) => ({ dispatchId: p.dispatchId, version: p.version })),
        ...(sacados.size > 0 ? { removeDispatchIds: [...sacados] } : {}),
      },
    },
    { onSuccess: () => { setSacados(new Set()); setDialogo(null); onCerrar(); } },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{`Lote #${datos.id} · ${datos.zone?.name ?? "Sin zona"}`}</h3>
          <p className="text-sm text-muted-foreground">
            {`Sale el ${formatearFechaTurno(datos.shiftDate)} · ${datos.vehicle ? `${datos.vehicle.plate} (${datos.vehicle.model})` : "Sin vehículo"} · Revisa: ${datos.reviewer?.fullName ?? "cualquier coordinador"}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setDialogo("vehiculo")} disabled={!puedeOperar}>
            <Truck aria-hidden /> Cambiar vehículo
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setDialogo("revisor")} disabled={!puedeOperar}>
            <UserRoundCog aria-hidden /> Reasignar
          </Button>
          <Button type="button" size="sm" onClick={() => setDialogo("aprobar")} disabled={!puedeOperar || motivoBloqueo !== null}>
            <CheckCheck aria-hidden /> Aprobar promesas
          </Button>
        </div>
      </div>

      {!esMio && (
        <p className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          {`Este lote lo revisa ${datos.reviewer?.fullName}. Puedes verlo, pero solo esa persona puede aprobarlo.`}
        </p>
      )}
      {esMio && motivoBloqueo && (
        <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {motivoBloqueo}
        </p>
      )}
      {datos.validation?.result === "failed" && (
        <p className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {`El corte devolvió este lote a revisión: ${datos.validation.reason ?? "revisa capacidad, vehículo, conductor y franjas"}.`}
        </p>
      )}

      {datos.capacity
        ? <OcupacionLote capacidad={datos.capacity} />
        : <p className="text-sm text-muted-foreground">Asigna un vehículo para ver la ocupación.</p>}

      <LotePedidosTable
        pedidos={datos.dispatches}
        sacados={sacados}
        onSacar={puedeEditarPedidos ? setASacar : undefined}
        onDevolver={puedeEditarPedidos ? (id) => setSacados((actual) => { const nuevo = new Set(actual); nuevo.delete(id); return nuevo; }) : undefined}
      />

      <SacarPedidoDialog
        pedido={aSacar && { id: aSacar.dispatchId, orderNumber: aSacar.sourceOrderRef, recipient: null }}
        onOpenChange={(abierto) => { if (!abierto) setASacar(null); }}
        onConfirmar={(id) => { setSacados((actual) => new Set(actual).add(id)); setASacar(null); }}
      />
      <AprobarPromesasDialog
        abierto={dialogo === "aprobar"}
        onOpenChange={(abierto) => setDialogo(abierto ? "aprobar" : null)}
        titulo={`lote #${datos.id}`}
        aprobados={aprobados.map((p) => ({ id: p.dispatchId, orderNumber: p.sourceOrderRef }))}
        sacados={sacadosLista.map((p) => ({ id: p.dispatchId, orderNumber: p.sourceOrderRef }))}
        aprobando={acciones.aprobando}
        onConfirmar={aprobar}
      />
      <CambiarVehiculoDialog
        abierto={dialogo === "vehiculo"}
        onOpenChange={(abierto) => setDialogo(abierto ? "vehiculo" : null)}
        vehiculoActualId={datos.vehicle?.id ?? null}
        opciones={vehiculos}
        guardando={acciones.cambiandoVehiculo}
        onConfirmar={(vehicleId) => acciones.cambiarVehiculo(
          { loteId: datos.id, vehicleId, version: datos.version },
          { onSuccess: () => setDialogo(null) },
        )}
      />
      <ReasignarLoteDialog
        abierto={dialogo === "revisor"}
        onOpenChange={(abierto) => setDialogo(abierto ? "revisor" : null)}
        revisorActualId={datos.reviewer?.id ?? null}
        opciones={revisores}
        guardando={acciones.reasignando}
        onConfirmar={({ payload, nombre }) => acciones.reasignarRevisor(
          { loteId: datos.id, payload, nombre },
          { onSuccess: () => setDialogo(null) },
        )}
      />
    </div>
  );
}
