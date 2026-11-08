import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, TriangleAlert, Undo2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { umbralesSchema, type UmbralesFormValues } from "../configuracion.schemas";
import type { CampoUmbral } from "../configuracion.types";
import type { ErrorUmbrales } from "../configuracion.umbrales";

const CAMPOS: { campo: CampoUmbral; etiqueta: string; unidad: string; ayuda: string }[] = [
  {
    campo: "slaAlertMinOnTimePct",
    etiqueta: "Cumplimiento SLA mínimo",
    unidad: "%",
    ayuda: "Si el porcentaje de entregas a tiempo baja de este valor, se genera una alerta.",
  },
  {
    campo: "gpsStaleAlertMinutes",
    etiqueta: "GPS sin señal",
    unidad: "min",
    ayuda: "Minutos sin ubicación de un repartidor en ruta antes de alertar.",
  },
  {
    campo: "driverIncidentAlertPerDay",
    etiqueta: "Incidencias por repartidor",
    unidad: "por día",
    ayuda: "Incidencias de un mismo repartidor en un día que disparan la alerta.",
  },
];

interface UmbralesFormProps {
  /** Valores actuales del back; el formulario se actualiza solo cuando cambian. */
  valores: UmbralesFormValues;
  onGuardar: (valores: UmbralesFormValues) => Promise<ErrorUmbrales | null>;
  guardando?: boolean;
}

/**
 * Formulario de umbrales de alerta (ST-67.2). Valida al escribir: el error sale bajo su campo y el
 * botón de guardar queda bloqueado mientras exista alguno. Los tres se guardan juntos.
 */
export function UmbralesForm({ valores, onGuardar, guardando = false }: UmbralesFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isValid },
  } = useForm<UmbralesFormValues>({
    resolver: zodResolver(umbralesSchema),
    values: valores,
    mode: "onChange",
  });

  const enviar = handleSubmit(async (nuevos) => {
    const error = await onGuardar(nuevos);
    if (!error) return;
    if (error.campo) setError(error.campo, { message: error.mensaje }, { shouldFocus: true });
    else setError("root", { message: error.mensaje });
  });

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      {errors.root?.message && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="umbrales-titulo" className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 space-y-1 border-b pb-3">
          <h2 id="umbrales-titulo" className="font-semibold">Cuándo alertar</h2>
          <p className="text-sm text-muted-foreground">
            Al pasar cualquiera de estos límites, el tablero de alertas avisa al supervisor.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPOS.map(({ campo, etiqueta, unidad, ayuda }) => {
            const id = `umbral-${campo}`;
            const error = errors[campo]?.message;
            return (
              <div key={campo} className="space-y-2">
                <Label htmlFor={id}>{etiqueta}</Label>
                <div className="relative">
                  <Input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : `${id}-ayuda`}
                    className="h-11 pr-20"
                    {...register(campo)}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {unidad}
                  </span>
                </div>
                {error ? (
                  <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {error}
                  </p>
                ) : (
                  <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">{ayuda}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
        {isDirty && !isValid && (
          <p className="text-sm text-destructive sm:mr-auto" role="status">Corrige los campos marcados para poder guardar.</p>
        )}
        <Button type="button" variant="outline" disabled={!isDirty || guardando} onClick={() => reset(valores)}>
          <Undo2 aria-hidden /> Descartar cambios
        </Button>
        <Button type="submit" disabled={!isDirty || !isValid || guardando}>
          {guardando ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {guardando ? "Guardando…" : "Guardar umbrales"}
        </Button>
      </div>
    </form>
  );
}
