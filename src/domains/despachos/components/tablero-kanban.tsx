import { useMemo, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CalendarDays, CircleAlert, Clock3, FileSearch, Truck, Wifi, WifiOff } from "lucide-react";

import { useTableroKanbanFiltros } from "../hooks/use-tablero-kanban-filtros";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { formatearFranja, formatearMetrosCubicos } from "../despachos.format";
import { PrioridadBadge } from "./pedido-badges";
import type { ColumnaKanban, ColumnaKanbanKey, DespachoKanban } from "../types/despachos.types";
import { COLUMNAS_OPERATIVAS, destinoAbreRevision, ordenarColumnas, puedeArrastrarDespacho } from "../tablero-kanban.rules";

interface TableroKanbanProps {
  zonas: { id: number; name: string }[];
  date: string;
  onDateChange: (date: string) => void;
  deliveryZoneId: string;
  onDeliveryZoneChange: (id: string) => void;
  driverId: string;
  onDriverChange: (id: string) => void;
  dispatchTypeId: string;
  onDispatchTypeChange: (id: string) => void;
  logisticaInversa: boolean;
  onLogisticaInversaChange: (value: boolean) => void;
  columns: ColumnaKanban[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  socketConnected: boolean;
  onRetry: () => void;
  onOpenReview: (batchId: number) => void;
  /** Abre la ficha 360° del despacho (ST-56.1); sin esto las tarjetas no muestran el enlace. */
  onOpenDetail?: (dispatchId: number) => void;
}

interface TarjetaProps {
  dispatch: DespachoKanban;
  draggable: boolean;
  overlay?: boolean;
  onOpenDetail?: (dispatchId: number) => void;
}

function TarjetaDespacho({ dispatch, draggable, overlay = false, onOpenDetail }: TarjetaProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `dispatch-${dispatch.id}`,
    disabled: !draggable || overlay,
    data: { dispatch },
  });
  const style = transform && !overlay
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const esUrgente = dispatch.priority === "urgent";

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...(draggable && !overlay ? { ...attributes, ...listeners } : {})}
      aria-label={`${dispatch.sourceOrderRef}, ${dispatch.dispatchType.name}`}
      className={`min-w-0 space-y-3 rounded-xl border bg-card p-3 shadow-sm transition-[box-shadow,border-color,opacity] ${
        draggable ? "cursor-grab touch-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""
      } ${isDragging ? "opacity-40" : ""} ${overlay ? "w-72 rotate-1 shadow-lg" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{dispatch.sourceOrderRef}</p>
          {dispatch.trackingCode && <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">Seguimiento {dispatch.trackingCode}</p>}
        </div>
        <PrioridadBadge priority={esUrgente ? "urgent" : "normal"} />
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-2"><Truck className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{dispatch.driver?.fullName ?? "Sin conductor"} · {dispatch.vehicle?.plate ?? "Sin vehículo"}</span>
        </p>
        <p className="truncate">{dispatch.zone?.name ?? "Sin zona"} · {dispatch.dispatchType.name}</p>
        <p className="flex items-center gap-2"><Clock3 className="size-3.5 shrink-0" aria-hidden />Franja {formatearFranja(dispatch.windowStart, dispatch.windowEnd)}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <span className="text-xs tabular-nums text-muted-foreground">{formatearMetrosCubicos(dispatch.volumeM3)} m³</span>
        {dispatch.status === "rescheduled" && (
          <Badge variant="outline" className="text-xs">Reintento {dispatch.attemptCount}/{dispatch.attemptLimit}</Badge>
        )}
        {dispatch.inbox === "proposed" && <Badge variant="secondary" className="text-xs">Propuesto</Badge>}
        {onOpenDetail && !overlay && (
          <button
            type="button"
            // Sin esto el clic empezaría a arrastrar la tarjeta.
            onPointerDown={(evento) => evento.stopPropagation()}
            onKeyDown={(evento) => evento.stopPropagation()}
            onClick={() => onOpenDetail(dispatch.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
            aria-label={`Ver ficha de ${dispatch.sourceOrderRef}`}
          >
            <FileSearch className="size-3.5" aria-hidden /> Ver ficha
          </button>
        )}
        {dispatch.inbox === "reserved" && (
          <Badge variant="secondary" className="max-w-full truncate text-xs">
            En planificación por {dispatch.reservation?.reservedByName ?? "otro coordinador"}
          </Badge>
        )}
      </div>
    </article>
  );
}

interface ColumnaProps {
  columna: ColumnaKanban;
  arrastrando: boolean;
  onOpenDetail?: (dispatchId: number) => void;
}

function ColumnaTablero({ columna, arrastrando, onOpenDetail }: ColumnaProps) {
  const habilitada = arrastrando && destinoAbreRevision(columna.key);
  const { isOver, setNodeRef } = useDroppable({ id: columna.key, disabled: !habilitada });
  const acento = columna.key === "incident"
    ? "border-t-destructive"
    : columna.key === "delivered" || columna.key === "returned"
      ? "border-t-success"
      : columna.key === "rescheduled" || columna.key === "returned_to_warehouse"
        ? "border-t-warning"
        : columna.key === "in_transit" || columna.key === "out_for_delivery" || columna.key === "picked_up_in_transit"
          ? "border-t-info"
          : "border-t-primary";

  return (
    <section
      ref={setNodeRef}
      aria-label={columna.label}
      data-column-key={columna.key}
      className={`flex h-[min(68vh,48rem)] min-h-[24rem] w-[min(19rem,calc(100vw-2rem))] shrink-0 flex-col overflow-hidden rounded-xl border border-t-4 bg-muted/30 transition-colors sm:w-[18rem] ${acento} ${
        habilitada ? "border-primary/60 bg-primary/5" : ""
      } ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <header className="sticky top-0 z-10 space-y-2 border-b bg-card/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold leading-5">{columna.label}</h2>
          <Badge variant="secondary" className="tabular-nums">{columna.ordersCount}</Badge>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">{columna.ordersCount} órdenes · {formatearMetrosCubicos(columna.volumeM3)} m³</p>
        {habilitada && <p className="text-xs font-medium text-primary">Soltar aquí abre la revisión del lote</p>}
      </header>
      <div className="min-h-0 min-w-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-2" aria-live="polite">
        {columna.dispatches.length === 0
          ? <p className="rounded-md border border-dashed bg-background/70 p-3 text-center text-xs text-muted-foreground">Sin despachos</p>
          : columna.dispatches.map((dispatch) => (
            <TarjetaDespacho
              key={dispatch.id}
              dispatch={dispatch}
              draggable={puedeArrastrarDespacho(dispatch.status, dispatch.routeBatch?.id ?? null)}
              onOpenDetail={onOpenDetail}
            />
          ))}
      </div>
    </section>
  );
}

function FiltroSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: number; name: string }[];
}) {
  return (
    <div className="min-w-0 flex-[1_1_12rem] space-y-1 sm:min-w-48">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-background" aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function BoardSkeleton() {
  return <div className="flex min-w-0 gap-3 overflow-x-auto overscroll-x-contain pb-3" aria-label="Cargando tablero">
    {COLUMNAS_OPERATIVAS.map(({ key, label }) => <div key={key} className="h-[min(66vh,46rem)] w-[17rem] shrink-0 animate-pulse rounded-xl border bg-muted/40" aria-label={`Cargando ${label}`} />)}
  </div>;
}

export function TableroKanban({
  zonas,
  date, onDateChange, deliveryZoneId, onDeliveryZoneChange, driverId, onDriverChange,
  dispatchTypeId, onDispatchTypeChange, logisticaInversa, onLogisticaInversaChange,
  columns, isLoading, isError, isFetching, socketConnected, onRetry, onOpenReview, onOpenDetail,
}: TableroKanbanProps) {
  const filtrosCatalogo = useTableroKanbanFiltros();
  const [dispatchDragging, setDispatchDragging] = useState<DespachoKanban | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const columnasVisibles = useMemo(() => ordenarColumnas(columns, logisticaInversa), [columns, logisticaInversa]);
  const drivers = (filtrosCatalogo.data?.drivers ?? []).map(({ id, fullName }) => ({ id, name: fullName }));
  const dispatchTypes = filtrosCatalogo.data?.dispatchTypes ?? [];
  const totalOrdenes = columnasVisibles.reduce((total, column) => total + column.ordersCount, 0);
  const totalVolumen = columnasVisibles.reduce((total, column) => total + column.volumeM3, 0);

  const dragStart = (event: DragStartEvent) => {
    setDispatchDragging((event.active.data.current as { dispatch?: DespachoKanban } | undefined)?.dispatch ?? null);
  };
  const dragEnd = (event: DragEndEvent) => {
    const dispatch = dispatchDragging;
    const destination = event.over?.id as ColumnaKanbanKey | undefined;
    setDispatchDragging(null);
    if (dispatch && destination && destinoAbreRevision(destination) && dispatch.routeBatch) onOpenReview(dispatch.routeBatch.id);
  };

  return (
    <div className="min-w-0 w-full space-y-5">
      <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-3 shadow-sm sm:p-4" aria-label="Filtros del tablero">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <div className="min-w-0 flex-[1_1_12rem] space-y-1 sm:min-w-48">
            <label htmlFor="tablero-date" className="text-xs font-medium text-muted-foreground">Fecha operativa</label>
            <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="tablero-date" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="pl-9" />
            </div>
          </div>
          <FiltroSelect label="Zona logística" value={deliveryZoneId} onChange={onDeliveryZoneChange} options={zonas} />
          <FiltroSelect label="Conductor" value={driverId} onChange={onDriverChange} options={drivers} />
          <FiltroSelect label="Tipo de despacho" value={dispatchTypeId} onChange={onDispatchTypeChange} options={dispatchTypes} />
          <div className="flex min-h-10 min-w-0 flex-[1_1_12rem] items-center gap-2 rounded-md border px-3 sm:flex-none">
            <Switch id="reverse-logistics" checked={logisticaInversa} onCheckedChange={onLogisticaInversaChange} />
            <label htmlFor="reverse-logistics" className="cursor-pointer text-sm font-medium">Logística inversa</label>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
          <p className="font-medium tabular-nums">{totalOrdenes} órdenes <span className="text-muted-foreground">· {formatearMetrosCubicos(totalVolumen)} m³</span></p>
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            {socketConnected ? <><Wifi className="size-4 text-success" aria-hidden />Actualización en vivo</> : <><WifiOff className="size-4 text-warning" aria-hidden />Sin conexión en vivo · consulta cada 15 s</>}
            {isFetching && <span>Actualizando…</span>}
          </div>
        </div>
      </section>

      <p className="-mt-2 flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1 size-2 shrink-0 rounded-full bg-info" aria-hidden />Arrastrar nunca cambia el estado. Al soltar en Programado o Asignado se abre la revisión del lote; las demás etapas las gestiona el repartidor.</p>

      {isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <span className="flex items-center gap-2"><CircleAlert className="size-4 text-destructive" aria-hidden />No se pudo cargar el tablero.</span>
        <button type="button" onClick={onRetry} className="font-medium text-destructive underline underline-offset-4">Reintentar</button>
      </div>}
      {isLoading && <BoardSkeleton />}
      {!isLoading && !isError && (
        <DndContext sensors={sensors} onDragStart={dragStart} onDragEnd={dragEnd} onDragCancel={() => setDispatchDragging(null)}>
          <div className="flex min-w-0 w-full gap-3 overflow-x-auto overscroll-x-contain rounded-2xl border bg-muted/20 p-2 pb-3 sm:gap-4 sm:p-3" aria-label="Columnas de despachos" aria-busy={isFetching}>
            {columnasVisibles.map((columna) => <ColumnaTablero key={columna.key} columna={columna} arrastrando={Boolean(dispatchDragging)} onOpenDetail={onOpenDetail} />)}
          </div>
          <DragOverlay>{dispatchDragging && <TarjetaDespacho dispatch={dispatchDragging} draggable={false} overlay />}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
