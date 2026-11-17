import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Wrench } from "lucide-react";

import {
  AvanzarMantenimientoDialog,
  MantenimientoDialog,
  MantenimientosFiltros,
  MantenimientosTable,
  useAccionesMantenimiento,
  useHistorialMantenimientos,
  useVehiculos,
  type ErrorMantenimiento,
  type Mantenimiento,
  type RegistrarMantenimientoInput,
  type VehiculoOpcion,
} from "@/domains/flota";
import { useTiposIncidenteVehiculo } from "@/domains/catalogos";
import { portalHref } from "@/config/portal-routes";
import { PageHeader } from "@/shared/components/common/page-header";
import { PaginationControls } from "@/shared/components/common/pagination-controls";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Button } from "@/shared/components/ui/button";

/** El back acepta hasta 100 por página: alcanza para el selector de vehículos de la flota. */
const VEHICULOS_PARAMS = { page: 1, limit: 100 };

/**
 * Historial de mantenimientos (ST-64.2, RF-A17). Muestra toda la flota; la ruta con :id solo
 * redirige al mismo historial con ese vehículo ya filtrado (?vehiculo=:id).
 */
export default function FlotaMantenimientoPage() {
  const { id } = useParams();
  if (id !== undefined) {
    const vehiculo = /^\d+$/.test(id) ? `?vehiculo=${id}` : "";
    return <Navigate replace to={`${portalHref("flotaMantenimientos")}${vehiculo}`} />;
  }
  return <HistorialMantenimientos />;
}

function HistorialMantenimientos() {
  const historial = useHistorialMantenimientos();
  const acciones = useAccionesMantenimiento();
  const flota = useVehiculos(VEHICULOS_PARAMS);
  const [porAvanzar, setPorAvanzar] = useState<Mantenimiento | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const vehiculos = useMemo<VehiculoOpcion[]>(
    () => flota.data.map(({ id, plate, model }) => ({ id, plate, model })),
    [flota.data],
  );
  const { filtros, historial: consulta } = historial;
  const filtrado = filtros.vehiculoId !== null || filtros.estado !== null || !!filtros.desde || !!filtros.hasta;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flota"
        title="Mantenimiento"
        icon={Wrench}
        description="Historial de mantenimientos e incidencias de la flota: filtra, inicia y completa."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={portalHref("flota")}><ArrowLeft aria-hidden /> Vehículos</Link>
            </Button>
            <Button onClick={() => setRegistrando(true)}>
              <Plus aria-hidden /> Registrar incidencia
            </Button>
          </div>
        )}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Historial de mantenimientos">
        <div className="border-b pb-4">
          <MantenimientosFiltros
            filtros={filtros}
            vehiculos={vehiculos}
            rangoInvertido={historial.rangoInvertido}
            onVehiculoChange={historial.setVehiculo}
            onEstadoChange={historial.setEstado}
            onDesdeChange={historial.setDesde}
            onHastaChange={historial.setHasta}
            onLimpiar={historial.limpiarFiltros}
          />
        </div>

        {consulta.isError ? (
          <ErrorAlert error={consulta.error} title="No pudimos cargar el historial" onRetry={() => consulta.refetch()}
            isRetrying={consulta.isFetching} className="mt-4" />
        ) : (
          <div className="mt-4">
            <MantenimientosTable
              data={historial.mantenimientos}
              loading={consulta.isLoading}
              filtrado={filtrado}
              onLimpiarFiltros={historial.limpiarFiltros}
              onAvanzar={setPorAvanzar}
              avanzando={acciones.avanzando}
            />
          </div>
        )}

        {!consulta.isError && !consulta.isLoading && historial.total > 0 && (
          <PaginationControls page={filtros.pagina} totalPages={historial.paginas} reportedPage={consulta.data?.meta.page}
            onPageChange={historial.setPagina} busy={consulta.isFetching} />
        )}
      </section>

      <AvanzarMantenimientoDialog
        mantenimiento={porAvanzar}
        onCerrar={() => setPorAvanzar(null)}
        onConfirmar={acciones.avanzar}
        avanzando={acciones.avanzando}
      />

      {registrando && (
        <MantenimientoDialogConCatalogo
          abierto
          onOpenChange={setRegistrando}
          vehiculos={vehiculos}
          vehiculoInicial={filtros.vehiculoId}
          onRegistrar={acciones.registrar}
          registrando={acciones.registrando}
        />
      )}
    </div>
  );
}

function MantenimientoDialogConCatalogo(props: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  vehiculos: VehiculoOpcion[];
  vehiculoInicial: number | null;
  onRegistrar: (input: RegistrarMantenimientoInput) => Promise<ErrorMantenimiento | null>;
  registrando: boolean;
}) {
  const tipos = useTiposIncidenteVehiculo({ page: 1, limit: 100 });
  return (
    <MantenimientoDialog
      {...props}
      tipos={tipos.data}
      tiposCargando={tipos.isLoading}
      tiposError={tipos.isError}
    />
  );
}
