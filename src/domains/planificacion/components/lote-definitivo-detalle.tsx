import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCheck, CircleCheck, RefreshCw, Truck, UserRound } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAccionesLote } from "../hooks/use-acciones-lote";
import { useAprobacionFinal } from "../hooks/use-aprobacion-final";
import { useLote } from "../hooks/use-lotes";
import type { HallazgoValidacion } from "../lotes.types";
import { calcularCapacidad, puedeAprobarPorCapacidad } from "../planificacion.capacidad";
import { formatearFechaTurno } from "../planificacion.format";
import { AprobarLoteDialog } from "./aprobar-lote-dialog";
import { CambiarConductorDialog, type OpcionConductor } from "./cambiar-conductor-dialog";
import { CambiarVehiculoDialog, type OpcionVehiculo } from "./cambiar-vehiculo-dialog";
import { BarraCapacidad } from "./capacidad-vehiculo";
import { LotePedidosTable } from "./lote-pedidos-table";
import { RelojRevisionLote } from "./reloj-revision";

interface LoteDefinitivoDetalleProps {
  loteId: number;
  vehiculos: OpcionVehiculo[];
  conductores: OpcionConductor[];
  /** Parámetros `final_review_end_time` y `final_review_escalation_time` (HH:mm). */
  horasRevision: { finRevision: string; escalamiento: string };
  /** El lote se aprobó, volvió a provisional o ya no existe: la página vuelve a la lista. */
  onCerrar: () => void;
}

const SIN_PEDIDOS = new Set<number>();

function Hallazgos({ titulo, items, tono }: { titulo: string; items: HallazgoValidacion[]; tono: "error" | "aviso" }) {
  if (items.length === 0) return null;
  const clase = tono === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning";
  return (
    <div className={`rounded-md border p-3 text-sm ${clase}`}>
      <p className="font-medium">{titulo}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {items.map((h, i) => (
          <li key={`${h.code}-${i}`}>{h.detail ?? h.code}{h.dispatchIds?.length ? ` (pedidos ${h.dispatchIds.join(", ")})` : ""}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Revisión final del lote definitivo y 2.ª aprobación (ST-51.1): resultado de la validación del corte,
 * reloj de revisión, capacidad con exceso exacto, corrección de vehículo o conductor y «Aprobar lote».
 */
export function LoteDefinitivoDetalle({ loteId, vehiculos, conductores, horasRevision, onCerrar }: LoteDefinitivoDetalleProps) {
  const lote = useLote(loteId);
  const [dialogo, setDialogo] = useState<"aprobar" | "vehiculo" | "conductor" | null>(null);
  const recargar = () => {
    setDialogo(null);
    void lote.refetch().then(({ data }) => { if (!data || data.status !== "pending_final_review") onCerrar(); });
  };
  const acciones = useAccionesLote({ alRecargar: recargar });
  const final = useAprobacionFinal({ alRecargar: recargar });

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
  const ocupado = acciones.ocupado || final.aprobando || final.cambiandoConductor;
  const editable = datos.status === "pending_final_review" && !ocupado;
  const peso = { usado: datos.capacity?.weight.actual ?? 0, capacidad: datos.capacity?.weight.capacity ?? null };
  const volumen = { usado: datos.capacity?.volume.actual ?? 0, capacidad: datos.capacity?.volume.capacity ?? null };
  const porCapacidad = puedeAprobarPorCapacidad([calcularCapacidad("peso", peso), calcularCapacidad("volumen", volumen)]);
  const listo = Boolean(datos.vehicle && datos.proposedDriver && porCapacidad.permitida);

  // Tras corregir: si el lote no pasó la nueva validación vuelve a provisional y sale de esta lista.
  const trasCorregir = (status: string, avisar: boolean) => {
    setDialogo(null);
    if (status !== "provisional") return;
    if (avisar) toast.warning("El lote no pasó la nueva validación y volvió a provisional: revísalo en la pestaña de 1.ª aprobación.");
    onCerrar();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{`Lote #${datos.id} · ${datos.zone?.name ?? "Sin zona"}`}</h3>
          <p className="text-sm text-muted-foreground">
            {`Sale el ${formatearFechaTurno(datos.shiftDate)} · ${datos.dispatchCount} ${datos.dispatchCount === 1 ? "pedido" : "pedidos"}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setDialogo("vehiculo")} disabled={!editable}>
            <Truck aria-hidden /> Cambiar vehículo
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setDialogo("conductor")} disabled={!editable}>
            <UserRound aria-hidden /> Cambiar conductor
          </Button>
          <Button type="button" size="sm" onClick={() => setDialogo("aprobar")} disabled={!editable}>
            <CheckCheck aria-hidden /> Aprobar lote
          </Button>
        </div>
      </div>

      <RelojRevisionLote fechaTurno={datos.shiftDate} finRevision={horasRevision.finRevision} escalamiento={horasRevision.escalamiento} />

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md border p-3">
          <dt className="text-xs text-muted-foreground">Vehículo</dt>
          <dd className="font-medium">{datos.vehicle ? `${datos.vehicle.plate} · ${datos.vehicle.model}` : "Sin vehículo"}</dd>
        </div>
        <div className="rounded-md border p-3">
          <dt className="text-xs text-muted-foreground">Conductor propuesto</dt>
          <dd className="font-medium">{datos.proposedDriver?.fullName ?? "Sin conductor"}</dd>
        </div>
      </dl>

      {datos.validation?.result === "validated" && (
        <p className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> El sistema validó franjas, capacidad y recursos en el último corte.
        </p>
      )}
      {datos.validation && (
        <>
          <Hallazgos titulo="El sistema encontró problemas" items={datos.validation.failures} tono="error" />
          <Hallazgos titulo="Advertencias de la validación" items={datos.validation.warnings} tono="aviso" />
        </>
      )}
      {!listo && (
        <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {!datos.vehicle ? "Falta asignar el vehículo." : !datos.proposedDriver ? "Falta el conductor propuesto." : porCapacidad.motivos.join(" ")}
        </p>
      )}

      {datos.capacity && (
        <div className="space-y-3">
          <BarraCapacidad capacidad={calcularCapacidad("peso", peso)} />
          <BarraCapacidad capacidad={calcularCapacidad("volumen", volumen)} />
        </div>
      )}

      <LotePedidosTable pedidos={datos.dispatches} sacados={SIN_PEDIDOS} />

      <AprobarLoteDialog
        abierto={dialogo === "aprobar"}
        onOpenChange={(abierto) => setDialogo(abierto ? "aprobar" : null)}
        titulo={`el lote #${datos.id}`}
        conductor={datos.proposedDriver?.fullName ?? null}
        vehiculo={datos.vehicle ? `${datos.vehicle.plate} · ${datos.vehicle.model}` : null}
        cantidadPedidos={datos.dispatchCount}
        peso={peso}
        volumen={volumen}
        aprobando={final.aprobando}
        onConfirmar={() => final.aprobarLote(
          {
            loteId: datos.id,
            payload: { version: datos.version, dispatches: datos.dispatches.map((p) => ({ dispatchId: p.dispatchId, version: p.version })) },
          },
          { onSuccess: () => { setDialogo(null); onCerrar(); } },
        )}
      />
      <CambiarVehiculoDialog
        abierto={dialogo === "vehiculo"}
        onOpenChange={(abierto) => setDialogo(abierto ? "vehiculo" : null)}
        vehiculoActualId={datos.vehicle?.id ?? null}
        opciones={vehiculos}
        guardando={acciones.cambiandoVehiculo}
        onConfirmar={(vehicleId) => acciones.cambiarVehiculo(
          { loteId: datos.id, vehicleId, version: datos.version },
          { onSuccess: (resultado) => trasCorregir(resultado.status, true) },
        )}
      />
      <CambiarConductorDialog
        abierto={dialogo === "conductor"}
        onOpenChange={(abierto) => setDialogo(abierto ? "conductor" : null)}
        conductorActualId={datos.proposedDriver?.id ?? null}
        opciones={conductores}
        guardando={final.cambiandoConductor}
        onConfirmar={(conductor) => final.cambiarConductor(
          { loteId: datos.id, driverId: conductor.id, version: datos.version, nombre: conductor.nombre },
          { onSuccess: (resultado) => trasCorregir(resultado.status, false) },
        )}
      />
    </div>
  );
}
