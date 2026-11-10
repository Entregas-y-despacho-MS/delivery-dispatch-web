import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { lotesKeys } from "../planificacion.mutaciones";
import { formatearFechaTurno } from "../planificacion.format";
import type { OpcionVehiculo } from "./cambiar-vehiculo-dialog";
import type { OpcionRevisor } from "./reasignar-lote-dialog";
import { aprobarLoteFinal, corregirLoteFinal } from "../services/lotes-provisionales.service";
import { useLote } from "../hooks/use-lotes";
import { OcupacionLote } from "./ocupacion-lote";
import { LotePedidosTable } from "./lote-pedidos-table";

interface Props {
  loteId: number;
  vehiculos: OpcionVehiculo[];
  conductores: OpcionRevisor[];
  horariosRevision: { final_review_end_time: string; final_review_escalation_time: string };
  onCerrar: () => void;
}

export function LoteAprobacionFinal({ loteId, vehiculos, conductores, horariosRevision, onCerrar }: Props) {
  const queryClient = useQueryClient();
  const lote = useLote(loteId);
  const [ahora, setAhora] = useState(() => Date.now());
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<string | null>(null);
  const [conductorSeleccionado, setConductorSeleccionado] = useState<string | null>(null);
  const vehiculoId = vehiculoSeleccionado ?? String(lote.data?.vehicle?.id ?? "");
  const conductorId = conductorSeleccionado ?? String(lote.data?.proposedDriver?.id ?? "");

  useEffect(() => { const id = window.setInterval(() => setAhora(Date.now()), 30_000); return () => window.clearInterval(id); }, []);
  const corregir = useMutation({
    mutationFn: async ({ field, value }: { field: "vehicleId" | "driverId"; value: number }) => corregirLoteFinal(loteId, { version: lote.data!.version, [field]: value }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: lotesKeys.detail(loteId) }); await queryClient.invalidateQueries({ queryKey: lotesKeys.all }); toast.success("Se guardó la corrección y se volvió a validar el lote"); },
    onError: (error) => { toast.error(parseApiError(error).message); void lote.refetch(); },
  });
  const aprobar = useMutation({
    mutationFn: () => aprobarLoteFinal(loteId, { version: lote.data!.version, dispatches: lote.data!.dispatches.map(({ dispatchId, version }) => ({ dispatchId, version })) }),
    onSuccess: async () => { toast.success("Lote aprobado y asignado"); await queryClient.invalidateQueries({ queryKey: lotesKeys.all }); onCerrar(); },
    onError: (error) => { toast.error(parseApiError(error).message); void lote.refetch(); },
  });

  const datos = lote.data;
  const esRecojoProveedor = datos?.zone === null;
  const superaCapacidad = Boolean(datos?.capacity && (datos.capacity.weight.usedPercent > 100 || datos.capacity.volume.usedPercent > 100));
  const validacionFallida = datos?.validation?.result !== "validated";
  const puedeAprobar = Boolean(datos && datos.status === "pending_final_review" && datos.dispatches.length > 0 && datos.capacity?.assignable && !superaCapacidad && !validacionFallida && !aprobar.isPending && !corregir.isPending);
  const ahoraLocal = useMemo(() => new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", timeZone: "America/La_Paz" }).format(new Date(ahora)), [ahora]);

  if (lote.isLoading) return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (lote.isError || !datos) return <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"><p>No se pudo abrir el lote. Puede que ya se haya aprobado o actualizado.</p><Button variant="outline" onClick={() => void lote.refetch()}><RefreshCw aria-hidden /> Reintentar</Button></div>;

  const campoResumen = (titulo: string, actual: string, valor: string, opciones: { id: number; etiqueta: string }[], field: "vehicleId" | "driverId", onChange: (value: string) => void) => (
    <div className="space-y-1.5">
      <Label>{titulo}</Label>
      <div className="flex gap-2">
        <Select value={valor} onValueChange={onChange} disabled={corregir.isPending}>
          <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder={`Elegir ${titulo.toLowerCase()}`} /></SelectTrigger>
          <SelectContent>{opciones.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.etiqueta}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" disabled={!valor || valor === actual || corregir.isPending} onClick={() => corregir.mutate({ field, value: Number(valor) })}>Guardar</Button>
      </div>
    </div>
  );

  const detalleValidacion = datos.validation?.failures ?? [];
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm sm:p-6" aria-label={`Revisión final del lote ${datos.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Segunda aprobación</p><h3 className="text-xl font-semibold">{`Lote #${datos.id} · ${datos.zone?.name ?? "Recojos de proveedor"}`}</h3><p className="mt-1 text-sm text-muted-foreground">{`Salida ${formatearFechaTurno(datos.shiftDate)} · ${datos.dispatches.length} ${esRecojoProveedor ? (datos.dispatches.length === 1 ? "recojo" : "recojos") : (datos.dispatches.length === 1 ? "pedido" : "pedidos")} · revisión ${datos.reviewer?.fullName ?? "sin asignar"}`}</p></div>
        <Button variant="outline" onClick={() => void lote.refetch()} disabled={lote.isFetching}><RefreshCw className={lote.isFetching ? "animate-spin" : undefined} aria-hidden /> Actualizar</Button>
      </header>

      <div className="grid gap-3 rounded-xl bg-muted/35 p-4 sm:grid-cols-2">
        {campoResumen("Vehículo", String(datos.vehicle?.id ?? ""), vehiculoId, vehiculos.map(({ id, etiqueta }) => ({ id, etiqueta })), "vehicleId", (value) => setVehiculoSeleccionado(value))}
        {campoResumen("Conductor", String(datos.proposedDriver?.id ?? ""), conductorId, conductores.map(({ id, nombre }) => ({ id, etiqueta: nombre })), "driverId", (value) => setConductorSeleccionado(value))}
      </div>

      {datos.capacity ? <OcupacionLote capacidad={datos.capacity} /> : <p className="text-sm text-warning">Asigna un vehículo para validar capacidad.</p>}
      {superaCapacidad && <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{`No se puede aprobar: el exceso es ${Math.max(0, datos.capacity!.weight.actual - datos.capacity!.weight.capacity).toFixed(2)} kg y ${Math.max(0, datos.capacity!.volume.actual - datos.capacity!.volume.capacity).toFixed(3)} m³.`}</p>}
      {datos.validation && <div className={`rounded-lg border p-3 text-sm ${datos.validation.result === "validated" ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}><p className="font-medium">{datos.validation.result === "validated" ? "Validación aprobada" : "El lote necesita correcciones"}</p>{detalleValidacion.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{detalleValidacion.map((item, index) => <li key={`${item.code}-${index}`}>{item.detail ?? item.code}{item.dispatchIds?.length ? ` · pedidos ${item.dispatchIds.join(", ")}` : ""}</li>)}</ul>}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span>Fin de revisión: <strong>{horariosRevision.final_review_end_time || "Sin configurar"}</strong> · Escalamiento: <strong>{horariosRevision.final_review_escalation_time || "Sin configurar"}</strong></span><span className="tabular-nums text-muted-foreground">Hora local: {ahoraLocal}</span></div>
      <LotePedidosTable pedidos={datos.dispatches} modoRecojo={esRecojoProveedor} sacados={new Set()} />
      <p className="text-xs text-muted-foreground">{esRecojoProveedor ? "La aprobación asigna conductor y vehículo al lote de recojos. Los productos se validan al retirarlos y al recibirlos en almacén." : "Los pedidos se aprueban junto con el lote. Para retirarlos se requiere una operación de corrección del lote."}</p>
      <div className="flex justify-end"><Button onClick={() => aprobar.mutate()} disabled={!puedeAprobar}><CheckCheck aria-hidden />{aprobar.isPending ? "Aprobando lote…" : "Aprobar lote"}</Button></div>
    </section>
  );
}
