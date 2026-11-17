import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CalendarDays, CheckCircle2, Clock3, PackageCheck, RefreshCw, Truck, Warehouse } from "lucide-react";
import { toast } from "sonner";

import type { DespachoKanban } from "@/domains/despachos/types/despachos.types";
import { useTableroKanban } from "@/domains/despachos/hooks/use-tablero-kanban";
import { useProgramarRecojoProveedor } from "@/domains/procurement-pickups/hooks/use-programar-recojo-proveedor";
import { parseApiError } from "@/shared/lib/api-error";
import { PageHeader } from "@/shared/components/common/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";

const ESTADOS: Record<string, string> = {
  pending: "Pendiente de programación",
  in_planning: "En planificación",
  scheduled: "Recojo programado",
  assigned: "Asignado a repartidor",
  out_for_delivery: "Ruta iniciada",
  in_transit: "Camino al proveedor",
  picked_up_in_transit: "Recolectado · vuelve al almacén",
  returned_to_warehouse: "Recibido en almacén",
  delivered: "Cerrado",
  not_delivered: "Incidencia",
  returned: "Devuelto",
  incident: "Con incidencia",
  rescheduled: "Reprogramado",
};

function fechaLaPazHoy(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function mostrarFechaHora(value: string | null): string {
  if (!value) return "Franja pendiente";
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));
}

function mostrarFranja(start: string | null, end: string | null): string {
  if (!start || !end) return "Franja pendiente";
  const hora = new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${mostrarFechaHora(start)} – ${hora.format(new Date(end))}`;
}

function mensajeProgramacion(error: unknown): string {
  const parsed = parseApiError(error);
  switch (parsed.code) {
    case "SUPPLIER_PICKUP_INCOMPLETE": return "A la compra le falta la dirección, el horario del proveedor o el almacén destino. Revisa el mensaje de Compras.";
    case "PICKUP_WINDOWS_DO_NOT_INTERSECT": return "No queda una franja compatible entre el proveedor y la recepción del almacén.";
    case "PICKUP_CAPACITY_EXCEEDED": return "La carga estimada no cabe en los vehículos disponibles para la planificación.";
    case "DISPATCH_NOT_SCHEDULABLE": return "Este recojo ya cambió de estado. Actualiza la lista para ver su situación actual.";
    default: return parsed.message;
  }
}

function estadoVisual(status: string) {
  if (["returned_to_warehouse", "delivered"].includes(status)) return "default" as const;
  if (["incident", "rescheduled"].includes(status)) return "destructive" as const;
  return "secondary" as const;
}

export default function RecojosProveedorPage() {
  const [date, setDate] = useState(fechaLaPazHoy);
  const [dispatchSeleccionado, setDispatchSeleccionado] = useState<DespachoKanban | null>(null);
  const tablero = useTableroKanban({ date }, false);
  const recojos = useMemo(() => (tablero.data?.columns ?? []).flatMap((column) => column.dispatches)
    .filter((dispatch) => dispatch.dispatchType.name === "supplier_pickup"), [tablero.data]);
  const programacion = useProgramarRecojoProveedor({
    onSuccess: (result) => {
      toast.success(`Recojo programado para ${mostrarFechaHora(result.pickupWindow.startsAt)} · código ${result.trackingCode}.`);
      setDispatchSeleccionado(null);
    },
    onError: (error) => toast.error(mensajeProgramacion(error)),
  });

  function abrirProgramacion(dispatch: DespachoKanban) {
    setDispatchSeleccionado(dispatch);
  }

  const puedeProgramar = dispatchSeleccionado !== null && !programacion.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compras y proveedores"
        title="Recojos a proveedores"
        icon={Warehouse}
        description="Programa cada compra recibida desde Compras. El servidor acuerda la primera franja compatible entre el proveedor y el almacén; Planificación asigna el vehículo y agrupa solo recojos compatibles."
        action={<Button type="button" variant="outline" onClick={() => void tablero.refetch()} disabled={tablero.isFetching}>
          <RefreshCw className={tablero.isFetching ? "animate-spin" : undefined} aria-hidden />Actualizar
        </Button>}
      />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Recojos de proveedor por fecha">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Compras por recoger</h2>
            <p className="text-sm text-muted-foreground">Consulta los recojos del día operativo. Los recojos no usan cobertura de entrega ni se mezclan con pedidos de clientes.</p>
          </div>
          <label className="grid gap-1 text-sm font-medium">Día operativo
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full sm:w-48" />
          </label>
        </div>

        {tablero.isLoading && <div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>}
        {tablero.isError && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">No se pudieron cargar los recojos. Actualiza la lista o revisa la conexión con el servicio.</div>}
        {!tablero.isLoading && !tablero.isError && recojos.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <PackageCheck className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">No hay recojos de proveedor para este día</p>
            <p className="max-w-xl text-sm text-muted-foreground">Cuando llegue una compra por el flujo de Compras / Pub/Sub, aparecerá aquí para programar su recojo. Prueba otra fecha si el aviso se recibió otro día.</p>
          </div>
        )}

        <div className="grid gap-3 xl:grid-cols-2">
          {recojos.map((dispatch) => {
            const pending = dispatch.status === "pending" && dispatch.routeBatch === null;
            return (
              <article key={dispatch.id} className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all text-base font-semibold">{dispatch.sourceOrderRef}</p>
                    {dispatch.trackingCode ? <p className="text-sm text-muted-foreground">Seguimiento {dispatch.trackingCode}</p> : <p className="text-sm text-muted-foreground">Código de seguimiento pendiente de programación</p>}
                  </div>
                  <Badge variant={estadoVisual(dispatch.status)}>{ESTADOS[dispatch.status] ?? dispatch.status}</Badge>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4 shrink-0" aria-hidden />{mostrarFranja(dispatch.windowStart, dispatch.windowEnd)}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><Truck className="size-4 shrink-0" aria-hidden />{dispatch.vehicle?.plate ?? "Vehículo pendiente"} · {dispatch.driver?.fullName ?? "Repartidor pendiente"}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4 shrink-0" aria-hidden />{dispatch.routeBatch ? `Lote #${dispatch.routeBatch.id}` : "Todavía fuera de un lote"}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><Warehouse className="size-4 shrink-0" aria-hidden />Volumen estimado: {dispatch.volumeM3.toLocaleString("es-BO")} m³</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <span className="text-xs text-muted-foreground">Proveedor → almacén · recogida individual, no se mezcla con entregas.</span>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild type="button" variant="outline" size="sm"><Link to={`/app/despachos/${dispatch.id}`}>Ver ficha</Link></Button>
                    {pending ? <Button type="button" onClick={() => abrirProgramacion(dispatch)}><CalendarClock aria-hidden />Programar recojo</Button>
                      : dispatch.routeBatch ? <Button asChild type="button" variant="outline"><Link to={`/app/planificacion?loteId=${dispatch.routeBatch.id}`}>Ver planificación</Link></Button>
                        : <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><CheckCircle2 className="size-4" aria-hidden />En seguimiento</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={dispatchSeleccionado !== null} onOpenChange={(open) => { if (!open && !programacion.isPending) setDispatchSeleccionado(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar recojo de proveedor</DialogTitle>
            <DialogDescription>
              {dispatchSeleccionado?.sourceOrderRef}. El servidor elegirá la primera franja compatible con el horario del proveedor y la recepción del almacén. Planificación asignará vehículo y repartidor al lote exclusivo de recojos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDispatchSeleccionado(null)} disabled={programacion.isPending}>Volver</Button>
            <Button type="button" onClick={() => { if (dispatchSeleccionado) programacion.mutate({ dispatchId: dispatchSeleccionado.id }); }} disabled={!puedeProgramar}>
              {programacion.isPending ? "Programando…" : "Buscar franja y programar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
