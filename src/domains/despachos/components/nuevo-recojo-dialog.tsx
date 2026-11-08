import { lazy, Suspense, useMemo, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MapPin, PackagePlus, TriangleAlert } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { useAhora } from "../hooks/use-ahora";
import { useAlmacenes } from "../hooks/use-recojos";
import type { ErrorRecojo } from "../recojos.reglas";
import { hoyEnBolivia } from "../reprogramacion.reglas";
import {
  aCrearRecojoInput,
  crearRecojoSchema,
  RECOJO_FORM_VACIO,
  type RecojoFormValues,
} from "../recojos.schemas";
import type { CrearRecojoInput } from "../recojos.types";

// Leaflet pesa: el mapa se descarga solo cuando se abre el formulario.
const PuntoRecojoMapa = lazy(() => import("./punto-recojo-mapa"));

const CLASE_SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-[invalid=true]:border-destructive";

function Campo({ id, etiqueta, error, ayuda, children }: { id: string; etiqueta: string; error?: string; ayuda?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-xs text-muted-foreground">{ayuda}</p>
      ) : null}
    </div>
  );
}

/** Atributos de accesibilidad de un campo según tenga error o ayuda. */
const describir = (id: string, error?: string, ayuda?: string) => ({
  id,
  "aria-invalid": !!error,
  "aria-describedby": error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined,
});

interface NuevoRecojoDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onCrear: (input: CrearRecojoInput) => Promise<ErrorRecojo | null>;
  creando?: boolean;
  /** Fija el reloj (solo para pruebas). */
  ahora?: number;
}

/**
 * «Nuevo recojo» (ST-81.1, POST de ST-81.2): solo el coordinador. Valida igual que el back. Sin franja
 * (la asigna el planificador) ni catálogo de motivos: el motivo es texto libre.
 */
export function NuevoRecojoDialog({ abierto, onOpenChange, onCrear, creando = false, ahora }: NuevoRecojoDialogProps) {
  const reloj = useAhora(ahora);
  const hoy = hoyEnBolivia(reloj);
  const esquema = useMemo(() => crearRecojoSchema(hoy), [hoy]);
  const almacenes = useAlmacenes({ habilitado: abierto });
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<RecojoFormValues>({ resolver: zodResolver(esquema), defaultValues: RECOJO_FORM_VACIO });

  const latitud = useWatch({ control, name: "latitude" });
  const longitud = useWatch({ control, name: "longitude" });
  const numero = (valor: string) => (valor.trim() !== "" && Number.isFinite(Number(valor)) ? Number(valor) : null);

  const marcarPunto = (lat: number, lng: number) => {
    setValue("latitude", lat.toFixed(6), { shouldValidate: true, shouldDirty: true });
    setValue("longitude", lng.toFixed(6), { shouldValidate: true, shouldDirty: true });
  };

  const enviar = handleSubmit(async (valores) => {
    const error = await onCrear(aCrearRecojoInput(valores));
    if (!error) {
      onOpenChange(false);
      return;
    }
    if (error.campo) setError(error.campo, { message: error.mensaje }, { shouldFocus: true });
    else setError("root", { message: error.mensaje });
  });

  const cambiarAbierto = (siguiente: boolean) => {
    if (creando && !siguiente) return;
    onOpenChange(siguiente);
  };

  const e = errors;
  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      <DialogContent data-form-dialog className="form-dialog-content max-h-[90dvh] overflow-y-auto bg-card sm:max-w-3xl motion-reduce:animate-none">
        <FormDialogHeader
          icon={PackagePlus}
          title="Nuevo recojo"
          description="Registra una devolución para recoger donde el cliente. La franja la asigna el planificador."
        />
        <form onSubmit={enviar} className="space-y-6" noValidate>
          {e.root?.message && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertDescription>{e.root.message}</AlertDescription>
            </Alert>
          )}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">Cliente</legend>
            <Campo id="recojo-contacto" etiqueta="Nombre de quien entrega" error={e.contactName?.message}>
              <Input {...describir("recojo-contacto", e.contactName?.message)} autoComplete="off" maxLength={150} {...register("contactName")} />
            </Campo>
            <Campo id="recojo-telefono" etiqueta="Teléfono" error={e.contactPhone?.message}>
              <Input {...describir("recojo-telefono", e.contactPhone?.message)} type="tel" inputMode="tel" autoComplete="off" maxLength={30} {...register("contactPhone")} />
            </Campo>
            <Campo id="recojo-correo" etiqueta="Correo (opcional)" error={e.contactEmail?.message}>
              <Input {...describir("recojo-correo", e.contactEmail?.message)} type="email" autoComplete="off" maxLength={150} {...register("contactEmail")} />
            </Campo>
            <Campo id="recojo-rma" etiqueta="N.º de RMA (opcional)" error={e.rmaId?.message} ayuda="Solo informativo.">
              <Input {...describir("recojo-rma", e.rmaId?.message, "Solo informativo.")} autoComplete="off" maxLength={100} {...register("rmaId")} />
            </Campo>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-sm font-semibold">Dónde se recoge</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="recojo-direccion" etiqueta="Dirección" error={e.address?.message}>
                <Input {...describir("recojo-direccion", e.address?.message)} autoComplete="off" maxLength={300} {...register("address")} />
              </Campo>
              <Campo id="recojo-referencia" etiqueta="Referencia (opcional)" error={e.reference?.message}>
                <Input {...describir("recojo-referencia", e.reference?.message)} autoComplete="off" maxLength={300} {...register("reference")} />
              </Campo>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="size-4" aria-hidden /> Haz clic en el mapa para marcar el punto</p>
              <Suspense fallback={<Skeleton className="h-56 w-full rounded-lg" />}>
                {abierto && <PuntoRecojoMapa latitud={numero(latitud)} longitud={numero(longitud)} onElegir={marcarPunto} />}
              </Suspense>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="recojo-latitud" etiqueta="Latitud" error={e.latitude?.message}>
                <Input {...describir("recojo-latitud", e.latitude?.message)} inputMode="decimal" autoComplete="off" {...register("latitude")} />
              </Campo>
              <Campo id="recojo-longitud" etiqueta="Longitud" error={e.longitude?.message}>
                <Input {...describir("recojo-longitud", e.longitude?.message)} inputMode="decimal" autoComplete="off" {...register("longitude")} />
              </Campo>
            </div>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">Qué y cuándo</legend>
            <Campo id="recojo-almacen" etiqueta="Almacén de destino" error={e.warehouseCode?.message ?? (almacenes.isError ? "No pudimos cargar los almacenes." : undefined)}>
              <select {...describir("recojo-almacen", e.warehouseCode?.message)} className={CLASE_SELECT} disabled={almacenes.isLoading} {...register("warehouseCode")}>
                <option value="">{almacenes.isLoading ? "Cargando almacenes…" : "Elige el almacén"}</option>
                {(almacenes.data ?? []).map((a) => <option key={a.id} value={a.code}>{a.code} · {a.name}</option>)}
              </select>
            </Campo>
            <Campo id="recojo-fecha" etiqueta="Fecha preferida" error={e.preferredPickupDate?.message}>
              <Input {...describir("recojo-fecha", e.preferredPickupDate?.message)} type="date" min={hoy} {...register("preferredPickupDate")} />
            </Campo>
            <Campo id="recojo-contenido" etiqueta="Qué se recoge" error={e.packageContents?.message}>
              <Textarea {...describir("recojo-contenido", e.packageContents?.message)} className="min-h-20" maxLength={500} {...register("packageContents")} />
            </Campo>
            <Campo id="recojo-motivo" etiqueta="Motivo de la devolución" error={e.returnReason?.message}>
              <Textarea {...describir("recojo-motivo", e.returnReason?.message)} className="min-h-20" maxLength={500} {...register("returnReason")} />
            </Campo>
            <Campo id="recojo-cajas" etiqueta="Cajas estimadas (opcional)" error={e.estimatedBoxes?.message}>
              <Input {...describir("recojo-cajas", e.estimatedBoxes?.message)} inputMode="numeric" autoComplete="off" {...register("estimatedBoxes")} />
            </Campo>
          </fieldset>

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={creando} onClick={() => cambiarAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={creando}>
              {creando ? <LoaderCircle className="animate-spin" aria-hidden /> : <PackagePlus aria-hidden />}
              {creando ? "Registrando…" : "Registrar recojo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
