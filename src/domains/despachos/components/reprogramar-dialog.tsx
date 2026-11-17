import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, RotateCcw, Warehouse } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { FormDialogContent, FormDialogFooter } from "@/shared/components/common/form-dialog";
import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { obtenerTableroKanban } from "../services/tablero-kanban.service";
import { reprogramacionInternaService } from "../services/reprogramacion-interna.service";
import { despachoDetalleKeys } from "../hooks/use-despacho-detalle";
import { DISPATCHES_KANBAN_QUERY_KEY } from "../hooks/use-dispatch-events";

export interface MotivoReprogramacionOpcion {
  code: string;
  name: string;
  active: boolean;
}

export interface ReglasReprogramacion {
  slot_duration_minutes: string;
  morning_window_start: string;
  morning_window_end: string;
  afternoon_window_start: string;
  afternoon_window_end: string;
}

interface ReprogramarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  despachoId: number;
  fecha: string;
  fechaMinima: string;
  motivos: MotivoReprogramacionOpcion[];
  reglas: ReglasReprogramacion;
  cargandoReglas: boolean;
  errorReglas: boolean;
  onComplete?: () => void;
}

/** Acciones de coordinación ligadas al contador de intentos que calcula el servidor (ST-52.1). */
export function ReprogramarDialog({
  open,
  onOpenChange,
  despachoId,
  fecha,
  fechaMinima,
  motivos,
  reglas,
  cargandoReglas,
  errorReglas,
  onComplete,
}: ReprogramarDialogProps) {
  const client = useQueryClient();
  const [reasonCode, setReasonCode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(fechaMinima);
  const [slotKey, setSlotKey] = useState("");
  const [instructions, setInstructions] = useState("");
  const board = useQuery({
    queryKey: [...DISPATCHES_KANBAN_QUERY_KEY, { date: fecha }],
    queryFn: ({ signal }) => obtenerTableroKanban({ date: fecha }, signal),
    enabled: open,
  });
  const dispatch = board.data?.columns.flatMap((column) => column.dispatches).find((item) => item.id === despachoId);
  const intentosAgotados = !!dispatch && dispatch.attemptCount >= dispatch.attemptLimit;
  const opciones = useMemo(() => motivos.filter((item) => item.active), [motivos]);
  const slots = useMemo(() => {
    const parseMinutes = (value: string) => { const match = /^(\d{2}):(\d{2})/.exec(value); return match ? Number(match[1]) * 60 + Number(match[2]) : null; };
    const duration = Number(reglas.slot_duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0) return [];
    const ranges = [[reglas.morning_window_start, reglas.morning_window_end], [reglas.afternoon_window_start, reglas.afternoon_window_end]] as const;
    return ranges.flatMap(([start, end]) => {
      const first = parseMinutes(start); const last = parseMinutes(end);
      if (first === null || last === null || last <= first) return [];
      const values: { key: string; start: string; end: string }[] = [];
      for (let minute = first; minute + duration <= last; minute += duration) {
        const format = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
        values.push({ key: format(minute), start: format(minute), end: format(minute + duration) });
      }
      return values;
    });
  }, [reglas]);
  const selectedSlot = slots.find((slot) => slot.key === slotKey);
  const windowStart = selectedSlot ? `${deliveryDate}T${selectedSlot.start}:00-04:00` : "";
  const windowEnd = selectedSlot ? `${deliveryDate}T${selectedSlot.end}:00-04:00` : "";
  const reprogramar = useMutation({
    mutationFn: () => reprogramacionInternaService.reprogramar(despachoId, {
      reasonCode,
      windowStart,
      windowEnd,
      ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
    }),
    onSuccess: async () => { toast.success("Nueva franja guardada"); await invalidate(); onComplete?.(); close(); },
    onError: () => toast.error("No se pudo reprogramar. Revisa que la franja siga disponible y los datos estén vigentes."),
  });
  const devolver = useMutation({
    mutationFn: () => reprogramacionInternaService.devolver(despachoId, { reasonCode: reasonCode || undefined, notes: instructions.trim() || undefined }),
    onSuccess: async () => { toast.success("Despacho devuelto al almacén"); await invalidate(); onComplete?.(); close(); },
    onError: () => toast.error("No se pudo devolver el despacho. Puede haber cambiado su estado; actualiza la ficha."),
  });
  const busy = reprogramar.isPending || devolver.isPending;
  function close() { onOpenChange(false); setReasonCode(""); setSlotKey(""); setDeliveryDate(fechaMinima); setInstructions(""); }
  async function invalidate() {
    await Promise.all([
      client.invalidateQueries({ queryKey: despachoDetalleKeys.detail(despachoId) }),
      client.invalidateQueries({ queryKey: DISPATCHES_KANBAN_QUERY_KEY }),
    ]);
  }

  return <Dialog open={open} onOpenChange={(next) => { if (!busy) { if (next) onOpenChange(true); else close(); } }}>
    <FormDialogContent className="sm:max-w-3xl">
      <FormDialogHeader icon={CalendarClock} title={`Resolver despacho #${despachoId}`} description="El servidor valida el estado actual, los intentos permitidos y las franjas configuradas." />
      {board.isPending || cargandoReglas ? <p className="py-5 text-sm text-muted-foreground">Cargando reglas operativas…</p> : board.isError || errorReglas ? <p role="alert" className="text-sm text-destructive">No se pudieron cargar las reglas del despacho. Actualiza la pantalla e inténtalo de nuevo.</p> : !dispatch ? <p role="alert" className="text-sm text-muted-foreground">El despacho no aparece en el tablero del {fecha}. No se habilitan acciones sin su contador de intentos actualizado.</p> : <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p>Intentos registrados: <strong>{dispatch.attemptCount} de {dispatch.attemptLimit}</strong>. Esta cifra la calcula el backend.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resolution-reason">Motivo</Label>
          <Select value={reasonCode} onValueChange={setReasonCode}>
            <SelectTrigger id="resolution-reason"><SelectValue placeholder="Selecciona un motivo" /></SelectTrigger>
            <SelectContent>{opciones.map((item) => <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {!intentosAgotados && <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="new-window-date">Nueva fecha</Label><input id="new-window-date" type="date" min={fechaMinima} value={deliveryDate} onChange={(e) => { setDeliveryDate(e.target.value); setSlotKey(""); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm" /></div>
          <div className="space-y-2"><Label htmlFor="new-window-slot">Franja disponible</Label><Select value={slotKey} onValueChange={setSlotKey}><SelectTrigger id="new-window-slot"><SelectValue placeholder={slots.length ? "Selecciona una franja" : "Configura las franjas operativas"} /></SelectTrigger><SelectContent>{slots.map((slot) => <SelectItem key={slot.key} value={slot.key}>{slot.start}–{slot.end}</SelectItem>)}</SelectContent></Select></div>
        </div>}
        <div className="space-y-2"><Label htmlFor="resolution-instructions">Instrucciones <span className="font-normal text-muted-foreground">(opcional)</span></Label><textarea id="resolution-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={500} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
        {intentosAgotados && <p className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">Se alcanzó el límite configurado. La opción disponible es registrar la devolución al almacén.</p>}
      </div>}
      <FormDialogFooter>
        {intentosAgotados ? <Button variant="destructive" disabled={busy || !reasonCode || !dispatch || !["incident", "not_delivered"].includes(dispatch.status)} onClick={() => devolver.mutate()}><Warehouse aria-hidden /> Devolver al almacén</Button> : <Button disabled={busy || !dispatch || !["incident", "not_delivered", "scheduled", "assigned"].includes(dispatch.status) || !reasonCode || !windowStart} onClick={() => reprogramar.mutate()}><CalendarClock aria-hidden /> Reprogramar</Button>}
        <Button variant="outline" disabled={busy} onClick={close}><RotateCcw aria-hidden /> Cerrar</Button>
      </FormDialogFooter>
    </FormDialogContent>
  </Dialog>;
}
