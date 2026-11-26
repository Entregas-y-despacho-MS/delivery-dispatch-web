import { AlertTriangle, Info, RotateCw } from "lucide-react";

import { StatusBadge } from "@/shared/components/common/status-badge";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { parseApiError } from "@/shared/lib/api-error";
import { useDisponibilidadFlota } from "../hooks/use-disponibilidad-flota";
import {
  ESTADOS_FLOTA,
  MOTIVOS_ND,
  ND,
  hayFiltrosDisponibilidad,
  mensajeErrorDisponibilidad,
  tasaEntrega,
  textoCarga,
  textoDias,
  textoDisponibilidad,
  type DisponibilidadFlota,
  type EstadoFlota,
  type FiltroMantenimiento,
} from "../reportes.disponibilidad";
import { IndicadorCard } from "./indicador-card";

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export interface OpcionFlota {
  id: number;
  nombre: string;
}

function Campo({ id, etiqueta, children }: { id: string; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{etiqueta}</label>
      {children}
    </div>
  );
}

const TONO_ESTADO: Record<EstadoFlota, "success" | "warning" | "destructive"> = {
  active: "success",
  maintenance: "warning",
  out_of_service: "destructive",
};

function Resumen({ datos }: { datos: DisponibilidadFlota }) {
  const { availability: a, maintenance: m, productivity: p } = datos;
  const pasado = datos.cutoff.kind === "past";
  return (
    <div className="space-y-3">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <IndicadorCard titulo={`Disponibles al ${datos.cutoff.date}`} valor={textoDisponibilidad(a.assignable, a.registered)}
          detalle={pasado ? "Corte pasado: sin historial" : `asignables / registrados, n = ${a.registered ?? ND}`} tamano="destacado" />
        <IndicadorCard titulo="En mantenimiento" valor={a.inMaintenance === null ? ND : String(a.inMaintenance)} detalle="vehículos al corte" />
        <IndicadorCard titulo="Fuera de servicio" valor={a.outOfService === null ? ND : String(a.outOfService)} detalle="vehículos al corte" />
        <IndicadorCard titulo="Mantenimiento del período" valor={textoDias(m.calendarDays)} detalle={`n = ${m.count} registros`} />
      </dl>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {pasado && a.unavailableReason
          ? MOTIVOS_ND[a.unavailableReason]
          : "La disponibilidad es puntual: el estado de cada vehículo al momento del corte, no un promedio histórico del período."}
      </p>
      {m.overlapsDetected && (
        <p role="note" className="flex items-center gap-2 text-xs text-warning">
          <AlertTriangle className="size-3.5" aria-hidden /> Hay mantenimientos que se cruzan en un mismo vehículo: se contaron una sola vez, pero conviene revisarlos.
        </p>
      )}
      <dl className="grid gap-3 sm:grid-cols-3">
        <IndicadorCard titulo="Entregas del período" valor={String(p.deliveredCount)} detalle={`n = ${p.deliveredCount} despachos entregados`} />
        <IndicadorCard titulo="Intentos" valor={String(p.attemptCount)} detalle="cerrados, entregados o no" />
        <IndicadorCard titulo="Entregas / intentos" valor={tasaEntrega(p.deliveredCount, p.attemptCount)} detalle={`n = ${p.attemptCount}`} />
      </dl>
    </div>
  );
}

function TablaVehiculos({ datos }: { datos: DisponibilidadFlota }) {
  if (datos.vehicles.length === 0) return <p className="text-sm text-muted-foreground">Ningún vehículo coincide con los filtros (n = 0).</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Disponibilidad y carga por vehículo">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pr-3 font-medium">Vehículo</th>
            <th className="py-2 pr-3 font-medium">Estado al corte</th>
            <th className="py-2 pr-3 font-medium">Mantenimiento</th>
            <th className="py-2 pr-3 font-medium">Carga kg (pico)</th>
            <th className="py-2 pr-3 font-medium">Carga m³ (pico)</th>
            <th className="py-2 font-medium">Rutas · despachos</th>
          </tr>
        </thead>
        <tbody>
          {datos.vehicles.map((v) => (
            <tr key={v.vehicleId} className="border-t align-top">
              <td className="py-2 pr-3 font-medium">{v.plate}</td>
              <td className="py-2 pr-3">
                {v.fleetStatus ? <StatusBadge tone={TONO_ESTADO[v.fleetStatus]}>{ESTADOS_FLOTA[v.fleetStatus]}</StatusBadge> : ND}
              </td>
              <td className="py-2 pr-3">{textoDias(v.maintenance.calendarDays)}<span className="block text-xs text-muted-foreground">n = {v.maintenance.count}</span></td>
              <td className="py-2 pr-3 tabular-nums">{textoCarga(v.load.kg, "kg", v.load.withoutWeight)}</td>
              <td className="py-2 pr-3 tabular-nums">{textoCarga(v.load.m3, "m³", v.load.withoutVolume)}</td>
              <td className="py-2 tabular-nums">
                {v.load.routes} · n = {v.load.n}
                {v.load.unavailableReason && <span className="block text-xs text-muted-foreground">{MOTIVOS_ND[v.load.unavailableReason]}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">«≥» indica despachos sin estimado de peso o volumen: la carga real es al menos esa. kg y m³ no se combinan.</p>
    </div>
  );
}

function TablaRepartidores({ datos }: { datos: DisponibilidadFlota }) {
  const { productivity: p } = datos;
  if (p.detailRestricted) {
    return <p className="text-sm text-muted-foreground">{MOTIVOS_ND.role_restricted} El detalle por repartidor lo ve el Supervisor de Flota.</p>;
  }
  if (p.drivers.length === 0) return <p className="text-sm text-muted-foreground">Ningún repartidor cerró entregas en el período.</p>;
  return (
    <table className="w-full text-sm" aria-label="Entregas e intentos por repartidor">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          <th className="py-2 pr-3 font-medium">Repartidor</th>
          <th className="py-2 pr-3 font-medium">Entregas</th>
          <th className="py-2 pr-3 font-medium">Intentos</th>
          <th className="py-2 font-medium">Entregas / intentos</th>
        </tr>
      </thead>
      <tbody>
        {p.drivers.map((d) => (
          <tr key={d.driverId} className="border-t">
            <td className="py-2 pr-3">{d.driverName ?? `Repartidor #${d.driverId}`}</td>
            <td className="py-2 pr-3 tabular-nums">{d.deliveredCount}</td>
            <td className="py-2 pr-3 tabular-nums">{d.attemptCount}</td>
            <td className="py-2 tabular-nums">{tasaEntrega(d.deliveredCount, d.attemptCount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface DisponibilidadFlotaPanelProps {
  desde: string;
  hasta: string;
  habilitado?: boolean;
  puedeVerConductor: boolean;
  vehiculos: OpcionFlota[];
  repartidores: OpcionFlota[];
}

/**
 * Dashboard 3 de flota (ST-303.2, ES-303): disponibilidad al corte, mantenimiento, carga por vehículo y
 * productividad. Comparte el período con el reporte; el detalle por repartidor lo decide el back según el rol.
 */
export function DisponibilidadFlotaPanel({ desde, hasta, habilitado = true, puedeVerConductor, vehiculos, repartidores }: DisponibilidadFlotaPanelProps) {
  const { filtros, disponibilidad, actualizar, limpiarFiltros } = useDisponibilidadFlota({ desde, hasta, habilitado, puedeVerConductor });
  const datos = disponibilidad.data;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="disponibilidad-titulo">
      <div className="space-y-1">
        <h2 id="disponibilidad-titulo" className="text-lg font-semibold text-brand-blue">Disponibilidad y carga de la flota</h2>
        <p className="text-sm text-muted-foreground">Período del {desde} al {hasta}. El tiempo va en días calendario, nunca en horas.</p>
      </div>

      <div className="grid gap-3 border-b pb-4 sm:grid-cols-2 lg:grid-cols-5">
        <Campo id="disp-corte" etiqueta="Corte de disponibilidad">
          <Input id="disp-corte" type="date" value={filtros.corte} onChange={(e) => e.target.value && actualizar({ corte: e.target.value })} />
        </Campo>
        <Campo id="disp-vehiculo" etiqueta="Vehículo">
          <select id="disp-vehiculo" className={CLASE_SELECT} value={filtros.vehiculo ?? ""}
            onChange={(e) => actualizar({ vehiculo: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Todos</option>
            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        </Campo>
        {puedeVerConductor && (
          <Campo id="disp-conductor" etiqueta="Conductor">
            <select id="disp-conductor" className={CLASE_SELECT} value={filtros.conductor ?? ""}
              onChange={(e) => actualizar({ conductor: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Todos</option>
              {repartidores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </Campo>
        )}
        <Campo id="disp-estado" etiqueta="Estado del vehículo">
          <select id="disp-estado" className={CLASE_SELECT} value={filtros.estado ?? ""}
            onChange={(e) => actualizar({ estado: (e.target.value || null) as EstadoFlota | null })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_FLOTA).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="disp-mantenimiento" etiqueta="Mantenimiento">
          <select id="disp-mantenimiento" className={CLASE_SELECT} value={filtros.mantenimiento ?? ""}
            onChange={(e) => actualizar({ mantenimiento: (e.target.value || null) as FiltroMantenimiento })}>
            <option value="">Todos</option>
            <option value="rutina">Solo de rutina</option>
            <option value="incidente">Solo por falla</option>
          </select>
        </Campo>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
          {hayFiltrosDisponibilidad(filtros) && <Button type="button" variant="ghost" size="sm" onClick={limpiarFiltros}>Quitar filtros</Button>}
          <Button type="button" variant="outline" size="sm" onClick={() => void disponibilidad.refetch()} disabled={disponibilidad.isFetching}>
            <RotateCw className={disponibilidad.isFetching ? "animate-spin" : undefined} aria-hidden /> Actualizar
          </Button>
        </div>
      </div>

      {disponibilidad.isError ? (
        <ErrorAlert title="No pudimos cargar la disponibilidad" error={disponibilidad.error}
          description={mensajeErrorDisponibilidad(parseApiError(disponibilidad.error))}
          onRetry={() => disponibilidad.refetch()} isRetrying={disponibilidad.isFetching} />
      ) : !datos ? (
        <div className="space-y-3" role="status" aria-label="Cargando disponibilidad">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : (
        <div className={disponibilidad.isPlaceholderData ? "space-y-5 opacity-60" : "space-y-5"} aria-busy={disponibilidad.isFetching}>
          <Resumen datos={datos} />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Por vehículo <span className="font-normal text-muted-foreground">(n = {datos.n})</span></h3>
            <TablaVehiculos datos={datos} />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Por repartidor</h3>
            <TablaRepartidores datos={datos} />
          </div>
        </div>
      )}
    </section>
  );
}
