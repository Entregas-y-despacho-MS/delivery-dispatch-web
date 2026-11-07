import { useMemo, useState } from "react";
import { ClipboardList, Inbox } from "lucide-react";

import { ROLES, hasRole } from "@/config/roles";
import { useMotivosReprogramacion, useZonas } from "@/domains/catalogos";
import { useParametrosOperativos } from "@/domains/configuracion";
import {
  BandejaPedidosToolbar,
  BandejaPedidosVista,
  CancelarDespachoDialog,
  codigoParada,
  ExcluidosCotejoPanel,
  generarFranjas,
  MarcarResueltoDialog,
  mensajeErrorAccionCotejo,
  ResolverSolicitudDialog,
  useBandejaPedidos,
  useCambiarPrioridad,
  useCancelarDespacho,
  useExcluidosCotejo,
  useResolverCotejo,
  type ExcluidoCotejo,
} from "@/domains/despachos";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { parseApiError } from "@/shared/lib/api-error";
import { useAuthStore } from "@/shared/store/use-auth-store";

/** Zonas para el filtro rápido: el catálogo completo cabe en una página. */
const ZONAS_PARAMS = { page: 1, limit: 100 };
const MOTIVOS_PARAMS = { page: 1, limit: 100, active: true };
/** Valor por defecto de max_delivery_attempts si el parámetro todavía no está definido. */
const LIMITE_POR_DEFECTO = 3;
const hrefFicha = (id: number) => `/app/despachos/${id}`;

type AccionCotejo = { tipo: "reprogramar" | "cancelar" | "resolver"; parada: ExcluidoCotejo } | null;

/**
 * Panel «Excluidos por cotejo» (ST-241.4): paradas que no salieron con su ruta. El coordinador las
 * reprograma (modal de la ST-52.1), las cancela con causal o las marca resueltas si el bulto apareció.
 */
function ExcluidosCotejoSeccion() {
  const excluidos = useExcluidosCotejo();
  const roleId = useAuthStore((estado) => estado.user?.rol.id);
  const esCoordinador = hasRole(roleId, [ROLES.COORDINADOR]);
  const { valores } = useParametrosOperativos();
  const franjas = useMemo(() => generarFranjas(valores), [valores]);
  const limiteIntentos = Number(valores.max_delivery_attempts) || LIMITE_POR_DEFECTO;
  const motivosCatalogo = useMotivosReprogramacion(MOTIVOS_PARAMS);
  const motivos = useMemo(
    () => motivosCatalogo.data.filter((m) => m.active).map((m) => ({ code: m.code, name: m.name })),
    [motivosCatalogo.data],
  );
  const cancelar = useCancelarDespacho();
  const resolver = useResolverCotejo();
  const [accion, setAccion] = useState<AccionCotejo>(null);

  const abrir = (tipo: NonNullable<AccionCotejo>["tipo"]) => (parada: ExcluidoCotejo) => {
    cancelar.reset();
    resolver.reset();
    setAccion({ tipo, parada });
  };
  const cerrar = () => setAccion(null);
  const codigo = accion ? codigoParada(accion.parada) : "";

  return (
    <>
      <ExcluidosCotejoPanel
        data={excluidos.data ?? []}
        cargando={excluidos.isPending}
        error={excluidos.isError ? excluidos.error : undefined}
        onReintentar={() => void excluidos.refetch()}
        actualizando={excluidos.isFetching}
        puedeActuar={esCoordinador}
        onReprogramar={abrir("reprogramar")}
        onCancelar={abrir("cancelar")}
        onResolver={abrir("resolver")}
        hrefFicha={hrefFicha}
      />
      <ResolverSolicitudDialog
        dispatchId={accion?.tipo === "reprogramar" ? accion.parada.dispatchId : null}
        trackingCode={codigo}
        onCerrar={cerrar}
        motivos={motivos}
        franjas={franjas}
        limiteIntentos={limiteIntentos}
      />
      <CancelarDespachoDialog
        abierto={accion?.tipo === "cancelar"}
        onOpenChange={(abierto) => !abierto && cerrar()}
        codigo={codigo}
        enviando={cancelar.isPending}
        error={cancelar.error ? mensajeErrorAccionCotejo(parseApiError(cancelar.error)) : null}
        onConfirmar={(causal) => accion && cancelar.mutate({ id: accion.parada.dispatchId, causal }, { onSuccess: cerrar })}
      />
      <MarcarResueltoDialog
        abierto={accion?.tipo === "resolver"}
        onOpenChange={(abierto) => !abierto && cerrar()}
        codigo={codigo}
        enviando={resolver.isPending}
        error={resolver.error ? mensajeErrorAccionCotejo(parseApiError(resolver.error)) : null}
        onConfirmar={(nota) => accion && resolver.mutate({ id: accion.parada.dispatchId, nota }, { onSuccess: cerrar })}
      />
    </>
  );
}

/** Bandeja central de pedidos pendientes de planificación (ST-48.1, RF-A40). */
export default function DespachosPage() {
  const bandeja = useBandejaPedidos();
  const prioridad = useCambiarPrioridad();
  const { pedidos } = bandeja;
  const zonas = useZonas(ZONAS_PARAMS);
  const zonasOpciones = useMemo(() => zonas.data.map(({ id, name }) => ({ id, name })), [zonas.data]);
  const seleccionados = Object.keys(bandeja.seleccion).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Despachos"
        icon={ClipboardList}
        description="Pedidos listos y pendientes de planificación. Los que otro coordinador está armando aparecen bloqueados."
      />

      <ExcluidosCotejoSeccion />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Bandeja de pedidos pendientes">
        <div className="flex flex-col gap-4 border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Bandeja de pedidos</h2>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {pedidos.total} {pedidos.total === 1 ? "pedido pendiente" : "pedidos pendientes"}
              {seleccionados > 0 && ` · ${seleccionados} ${seleccionados === 1 ? "seleccionado" : "seleccionados"}`}
            </p>
          </div>
          <BandejaPedidosToolbar
            search={bandeja.search}
            onSearchChange={bandeja.setSearch}
            zonas={zonasOpciones}
            zona={bandeja.zonaFilter}
            onZonaChange={bandeja.setZonaFilter}
            turno={bandeja.turnoFilter}
            onTurnoChange={bandeja.setTurnoFilter}
            prioridad={bandeja.prioridadFilter}
            onPrioridadChange={bandeja.setPrioridadFilter}
            soloUrgentes={bandeja.soloUrgentes}
            onSoloUrgentesChange={bandeja.setSoloUrgentes}
            onRefrescar={bandeja.refrescar}
            refrescando={pedidos.isFetching}
          />
        </div>

        <div aria-busy={pedidos.isFetching}>
          <BandejaPedidosVista
            data={pedidos.data}
            loading={pedidos.isLoading}
            error={pedidos.isError ? pedidos.error : undefined}
            onReintentar={bandeja.refrescar}
            reintentando={pedidos.isFetching}
            filtrada={bandeja.hasFilters}
            onLimpiarFiltros={bandeja.clearFilters}
            orden={bandeja.orden}
            onToggleOrden={bandeja.toggleOrden}
            seleccion={bandeja.seleccion}
            onSeleccionChange={bandeja.setSeleccion}
            onCambiarPrioridad={prioridad.cambiarPrioridad}
            cambiandoPrioridadId={prioridad.cambiandoId}
          />
        </div>

        {!pedidos.isLoading && !pedidos.isError && pedidos.total > 0 && (
          <PaginationControls page={bandeja.page} totalPages={bandeja.totalPages} onPageChange={bandeja.setPage} />
        )}
      </section>
    </div>
  );
}
