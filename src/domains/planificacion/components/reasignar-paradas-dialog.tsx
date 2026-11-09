import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useLote } from "../hooks/use-lotes";
import { useDestinosReasignacion, useReasignarParadas } from "../hooks/use-reasignacion-paradas";

export function ReasignarParadasDialog({
  routeBatchId, onOpenChange, motivos,
}: { routeBatchId: number | null; onOpenChange: (open: boolean) => void; motivos: { id: number; code: string; name: string; active: boolean }[] }) {
  const abierto = routeBatchId !== null;
  const lote = useLote(routeBatchId);
  const destinos = useDestinosReasignacion(routeBatchId, abierto);
  const mutacion = useReasignarParadas();
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [destinoId, setDestinoId] = useState("");
  const [motivoId, setMotivoId] = useState("");
  const [conflicto, setConflicto] = useState(false);
  const disponibles = useMemo(() => lote.data?.dispatches.filter((d) => d.status === "out_for_delivery") ?? [], [lote.data]);
  const destino = destinos.data?.find((d) => String(d.routeBatchId) === destinoId);
  const ocupada = mutacion.isPending;

  const cerrar = (open: boolean) => { if (!open && !ocupada) { setSeleccionadas([]); setDestinoId(""); setMotivoId(""); setConflicto(false); onOpenChange(false); } };
  const recargar = async () => { setSeleccionadas([]); setDestinoId(""); setConflicto(false); await Promise.all([lote.refetch(), destinos.refetch()]); };
  const enviar = async () => {
    if (!routeBatchId || !lote.data || !destino || !motivoId || !seleccionadas.length) return;
    setConflicto(false);
    try {
      await mutacion.mutateAsync({ id: routeBatchId, payload: {
        dispatchIds: seleccionadas, targetBatchId: destino.routeBatchId, reasonCode: motivoId,
        version: lote.data.version, targetVersion: destino.version,
      } });
      cerrar(false);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) { setSeleccionadas([]); setDestinoId(""); setConflicto(true); }
    }
  };

  return <Dialog open={abierto} onOpenChange={cerrar}><DialogContent className="sm:max-w-xl">
    <DialogHeader><DialogTitle>Reasignar paradas</DialogTitle><DialogDescription>Selecciona paradas en reparto, un destino con capacidad y el motivo. El servidor vuelve a validar versiones y capacidad antes de guardar.</DialogDescription></DialogHeader>
    {conflicto && <div role="alert" className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /><span>El lote cambió o el destino perdió capacidad. Recarga los datos y vuelve a seleccionar las paradas.</span><Button type="button" variant="outline" size="sm" onClick={recargar}><RefreshCw className="mr-1 size-3.5" aria-hidden />Recargar</Button></div>}
    {lote.isLoading || destinos.isLoading ? <p role="status">Cargando lotes y destinos…</p> : null}
    {(lote.isError || destinos.isError) && <p role="alert">No se pudieron cargar las paradas o los destinos. <Button variant="link" onClick={recargar}>Reintentar</Button></p>}
    {!lote.isError && !destinos.isError && !lote.isLoading && !destinos.isLoading && <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
      <h3 className="text-sm font-semibold">Paradas pendientes ({disponibles.length})</h3>
      {disponibles.length === 0 ? <p className="text-sm text-muted-foreground">No hay paradas en reparto para reasignar.</p> : disponibles.map((parada) => <label key={parada.dispatchId} className="flex cursor-pointer items-start gap-3 rounded p-2 hover:bg-accent">
        <Checkbox checked={seleccionadas.includes(parada.dispatchId)} onCheckedChange={(checked) => setSeleccionadas((actual) => checked ? [...actual, parada.dispatchId] : actual.filter((id) => id !== parada.dispatchId))} aria-label={`Seleccionar ${parada.sourceOrderRef}`} />
        <span className="min-w-0 text-sm"><span className="block font-medium">{parada.sourceOrderRef}</span><span className="block text-muted-foreground">{parada.deliveryAddress}</span></span>
      </label>)}
    </div>}
    <div className="space-y-2"><Label htmlFor="destino-reasignacion">Repartidor y vehículo destino</Label><Select value={destinoId} onValueChange={setDestinoId} disabled={ocupada || !destinos.data?.length}><SelectTrigger id="destino-reasignacion"><SelectValue placeholder="Elige un destino con capacidad" /></SelectTrigger><SelectContent>{destinos.data?.map((d) => <SelectItem key={d.routeBatchId} value={String(d.routeBatchId)}>{d.driverFullName} · {d.vehiclePlate} · {d.zoneName ?? "Sin zona"} · Capacidad restante {d.remainingWeightKg} kg / {d.remainingVolumeM3} m³</SelectItem>)}</SelectContent></Select>{destinos.data?.length === 0 && <p className="text-xs text-muted-foreground">No hay rutas elegibles para este turno.</p>}</div>
    <div className="space-y-2"><Label htmlFor="motivo-reasignacion">Motivo</Label><Select value={motivoId} onValueChange={setMotivoId} disabled={ocupada}><SelectTrigger id="motivo-reasignacion"><SelectValue placeholder="Selecciona el motivo" /></SelectTrigger><SelectContent>{motivos.filter((m) => m.active).map((m) => <SelectItem key={m.id} value={m.code}>{m.name}</SelectItem>)}</SelectContent></Select></div>
    {destino && <p className="text-xs text-muted-foreground">Destino seleccionado: versión {destino.version}. El lote origen se enviará con versión {lote.data?.version}.</p>}
    <DialogFooter><Button variant="outline" onClick={() => cerrar(false)} disabled={ocupada}>Cancelar</Button><Button onClick={enviar} disabled={ocupada || conflicto || lote.isLoading || destinos.isLoading || !seleccionadas.length || !destino || !motivoId}>{ocupada ? "Reasignando…" : `Reasignar ${seleccionadas.length} parada${seleccionadas.length === 1 ? "" : "s"}`}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
