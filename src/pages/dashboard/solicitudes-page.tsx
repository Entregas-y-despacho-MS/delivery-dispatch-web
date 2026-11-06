import { useMemo, useState } from "react";
import { MessageSquareWarning } from "lucide-react";

import { ROLES, hasRole } from "@/config/roles";
import { useMotivosReprogramacion, useZonas } from "@/domains/catalogos";
import { useParametrosOperativos } from "@/domains/configuracion";
import {
  EnlaceSeguimientoDialog,
  generarFranjas,
  ResolverSolicitudDialog,
  SolicitudesCambioToolbar,
  SolicitudesCambioVista,
  useEnlaceSeguimiento,
  useSolicitudesCambio,
  type SolicitudCambio,
} from "@/domains/despachos";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { RequireRole } from "@/shared/guards/require-role";
import { useAuthStore } from "@/shared/store/use-auth-store";

const ZONAS_PARAMS = { page: 1, limit: 100 };
const MOTIVOS_PARAMS = { page: 1, limit: 100, active: true };
/** Valor por defecto de max_delivery_attempts si el parámetro todavía no está definido. */
const LIMITE_POR_DEFECTO = 3;
const hrefFicha = (id: number) => `/app/despachos/${id}`;

/** Bandeja del coordinador con las solicitudes de cambio del cliente (ST-224.3, RF-U21). */
export default function SolicitudesPage() {
  const bandeja = useSolicitudesCambio();
  const { solicitudes, filtros } = bandeja;
  const enlace = useEnlaceSeguimiento();
  const roleId = useAuthStore((estado) => estado.user?.rol.id);
  const esCoordinador = hasRole(roleId, [ROLES.COORDINADOR]);

  const zonas = useZonas(ZONAS_PARAMS);
  const zonasOpciones = useMemo(() => zonas.data.map(({ id, name }) => ({ id, name })), [zonas.data]);
  const { valores } = useParametrosOperativos();
  const franjas = useMemo(() => generarFranjas(valores), [valores]);
  const limiteIntentos = Number(valores.max_delivery_attempts) || LIMITE_POR_DEFECTO;
  const motivosCatalogo = useMotivosReprogramacion(MOTIVOS_PARAMS);
  const motivos = useMemo(
    () => motivosCatalogo.data.filter((m) => m.active).map((m) => ({ code: m.code, name: m.name })),
    [motivosCatalogo.data],
  );

  const [resolviendo, setResolviendo] = useState<SolicitudCambio | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Solicitudes de cambio"
        icon={MessageSquareWarning}
        description="Pedidos en los que el cliente pidió otro horario desde su enlace. Resuélvelos reprogramando; las más antiguas aparecen primero."
      />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Bandeja de solicitudes de cambio">
        <div className="flex flex-col gap-4 border-b pb-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {solicitudes.total} {solicitudes.total === 1 ? "solicitud pendiente" : "solicitudes pendientes"}
          </p>
          <SolicitudesCambioToolbar
            busqueda={bandeja.busqueda}
            onBusquedaChange={bandeja.setBusqueda}
            zonas={zonasOpciones}
            zona={filtros.zona}
            onZonaChange={bandeja.setZona}
            fecha={filtros.fecha}
            onFechaChange={bandeja.setFecha}
            onRefrescar={bandeja.refrescar}
            refrescando={solicitudes.isFetching}
          />
        </div>

        <div aria-busy={solicitudes.isFetching}>
          <SolicitudesCambioVista
            data={solicitudes.data}
            cargando={solicitudes.isLoading}
            error={solicitudes.isError ? solicitudes.error : undefined}
            onReintentar={bandeja.refrescar}
            reintentando={solicitudes.isFetching}
            filtrada={bandeja.hayFiltros}
            onLimpiarFiltros={bandeja.limpiarFiltros}
            puedeResolver={esCoordinador}
            onResolver={setResolviendo}
            onMostrarEnlace={enlace.mostrar}
            pidiendoEnlaceId={enlace.pidiendoId}
            hrefFicha={hrefFicha}
          />
        </div>

        {!solicitudes.isLoading && !solicitudes.isError && solicitudes.total > 0 && (
          <PaginationControls page={filtros.pagina} totalPages={bandeja.totalPaginas} onPageChange={bandeja.setPagina} />
        )}
      </section>

      <RequireRole roles={[ROLES.COORDINADOR]}>
        <ResolverSolicitudDialog
          dispatchId={resolviendo?.dispatchId ?? null}
          trackingCode={resolviendo?.trackingCode}
          onCerrar={() => setResolviendo(null)}
          motivos={motivos}
          franjas={franjas}
          limiteIntentos={limiteIntentos}
        />
      </RequireRole>
      <EnlaceSeguimientoDialog enlace={enlace.pendienteDeCopiar} onCerrar={enlace.olvidar} />
    </div>
  );
}
