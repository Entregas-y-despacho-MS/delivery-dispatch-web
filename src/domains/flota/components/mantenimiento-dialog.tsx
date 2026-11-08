import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, TriangleAlert, Wrench } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { useTiposIncidenteVehiculo } from "@/domains/catalogos";
import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import type { ErrorMantenimiento } from "../flota.mantenimiento";
import { registrarMantenimientoSchema, type RegistrarMantenimientoFormValues } from "../flota.schemas";
import type { RegistrarMantenimientoInput } from "../flota.types";
import type { VehiculoOpcion } from "./mantenimientos-filtros";

const CLASE_SELECT = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-[invalid=true]:border-destructive";

interface MantenimientoDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  vehiculos: VehiculoOpcion[];
  /** Vehículo ya elegido (por ejemplo, el del filtro del historial). */
  vehiculoInicial?: number | null;
  onRegistrar: (input: RegistrarMantenimientoInput) => Promise<ErrorMantenimiento | null>;
  registrando?: boolean;
}

function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {mensaje}
    </p>
  );
}

/**
 * Registro mínimo de una incidencia de vehículo (ST-64.2, POST de ST-64.1). Siempre empieza
 * «Pendiente». Si el tipo deja el vehículo fuera de servicio, el vehículo pasa a mantenimiento,
 * salvo que tenga lotes confirmados o en ruta: entonces el back responde 409 con esos lotes.
 */
export function MantenimientoDialog({
  abierto,
  onOpenChange,
  vehiculos,
  vehiculoInicial = null,
  onRegistrar,
  registrando = false,
}: MantenimientoDialogProps) {
  const tipos = useTiposIncidenteVehiculo({ limit: 100 });
  const [fallo, setFallo] = useState<ErrorMantenimiento | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegistrarMantenimientoFormValues>({
    resolver: zodResolver(registrarMantenimientoSchema),
    defaultValues: { vehiculoId: vehiculoInicial ? String(vehiculoInicial) : "", tipoIncidenteId: "", descripcion: "" },
  });

  const tipoElegido = useWatch({ control, name: "tipoIncidenteId" });
  const descripcion = useWatch({ control, name: "descripcion" }) ?? "";
  const dejaFueraDeServicio = useMemo(
    () => tipos.data.find((tipo) => String(tipo.id) === tipoElegido)?.disablesVehicle ?? false,
    [tipos.data, tipoElegido],
  );

  const enviar = handleSubmit(async (valores) => {
    setFallo(null);
    const error = await onRegistrar({
      vehicleId: Number(valores.vehiculoId),
      vehicleIncidentTypeId: Number(valores.tipoIncidenteId),
      description: valores.descripcion,
    });
    if (error) setFallo(error);
    else onOpenChange(false);
  });

  const cambiarAbierto = (siguiente: boolean) => {
    if (registrando && !siguiente) return;
    onOpenChange(siguiente);
  };

  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      <DialogContent data-form-dialog className="form-dialog-content max-h-[90dvh] overflow-y-auto bg-card sm:max-w-lg motion-reduce:animate-none">
        <FormDialogHeader
          icon={Wrench}
          title="Registrar incidencia"
          description="Queda «Pendiente» en el historial. Después podrás iniciarla y completarla."
        />
        <form onSubmit={enviar} className="space-y-5" noValidate>
          {fallo && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertDescription>
                <p>{fallo.mensaje}</p>
                {fallo.lotes && fallo.lotes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {fallo.lotes.map((lote) => (
                      <li key={lote.id}>
                        Lote #{lote.id} · {lote.shiftDate} ·{" "}
                        <Link className="underline underline-offset-4" to={`/app/planificacion?loteId=${lote.id}&accion=cambiar-vehiculo`}>
                          Cambiar vehículo del lote
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="mantenimiento-vehiculo">Vehículo</Label>
            <select id="mantenimiento-vehiculo" className={CLASE_SELECT} aria-invalid={!!errors.vehiculoId}
              aria-describedby={errors.vehiculoId ? "mantenimiento-vehiculo-error" : undefined} {...register("vehiculoId")}>
              <option value="">Elige un vehículo</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}
            </select>
            <ErrorCampo id="mantenimiento-vehiculo-error" mensaje={errors.vehiculoId?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mantenimiento-tipo">Tipo de incidente</Label>
            <select id="mantenimiento-tipo" className={CLASE_SELECT} disabled={tipos.isLoading} aria-invalid={!!errors.tipoIncidenteId}
              aria-describedby={errors.tipoIncidenteId ? "mantenimiento-tipo-error" : "mantenimiento-tipo-ayuda"} {...register("tipoIncidenteId")}>
              <option value="">{tipos.isLoading ? "Cargando tipos…" : "Elige el tipo"}</option>
              {tipos.data.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.code} · {tipo.name}</option>)}
            </select>
            {errors.tipoIncidenteId ? (
              <ErrorCampo id="mantenimiento-tipo-error" mensaje={errors.tipoIncidenteId.message} />
            ) : tipos.isError ? (
              <p id="mantenimiento-tipo-ayuda" className="text-sm text-destructive">No pudimos cargar los tipos de incidente.</p>
            ) : dejaFueraDeServicio ? (
              <p id="mantenimiento-tipo-ayuda" className="text-sm text-warning">Este tipo deja el vehículo en mantenimiento hasta que se complete.</p>
            ) : (
              <p id="mantenimiento-tipo-ayuda" className="text-sm text-muted-foreground">El catálogo lo administra el supervisor.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="mantenimiento-descripcion">Qué pasó</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{descripcion.length}/1000</span>
            </div>
            <Textarea id="mantenimiento-descripcion" className="min-h-24" maxLength={1000} aria-invalid={!!errors.descripcion}
              aria-describedby={errors.descripcion ? "mantenimiento-descripcion-error" : undefined}
              placeholder="Ej.: ruido metálico en las pastillas de freno delanteras" {...register("descripcion")} />
            <ErrorCampo id="mantenimiento-descripcion-error" mensaje={errors.descripcion?.message} />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={registrando} onClick={() => cambiarAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={registrando}>
              {registrando ? <LoaderCircle className="animate-spin" aria-hidden /> : <Wrench aria-hidden />}
              {registrando ? "Registrando…" : "Registrar incidencia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
