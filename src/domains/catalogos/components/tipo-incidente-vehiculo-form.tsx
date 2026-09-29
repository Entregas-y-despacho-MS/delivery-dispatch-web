import { zodResolver } from "@hookform/resolvers/zod";
import { Hash, LoaderCircle, TriangleAlert, Wrench } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { parseApiError } from "@/shared/lib/api-error";
import { tipoIncidenteVehiculoSchema, type TipoIncidenteVehiculoFormValues } from "../catalogos.schemas";
import type { SeveridadIncidenteVehiculo, TipoIncidenteVehiculo } from "../catalogos.types";
import { SEVERIDADES_INCIDENTE_VEHICULO } from "../tipos-incidente-vehiculo.constants";

interface TipoIncidenteVehiculoFormProps {
  tipo?: TipoIncidenteVehiculo;
  onSubmit: (values: TipoIncidenteVehiculoFormValues) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  guardando?: boolean;
}

export function TipoIncidenteVehiculoForm({
  tipo,
  onSubmit,
  onCancel,
  onDirtyChange,
  guardando = false,
}: TipoIncidenteVehiculoFormProps) {
  const { register, control, handleSubmit, setError, formState: { errors, isDirty } } =
    useForm<TipoIncidenteVehiculoFormValues>({
      resolver: zodResolver(tipoIncidenteVehiculoSchema),
      defaultValues: {
        code: tipo?.code ?? "",
        name: tipo?.name ?? "",
        severity: tipo?.severity,
        disablesVehicle: tipo?.disablesVehicle,
      },
      mode: "onTouched",
      reValidateMode: "onChange",
    });

  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const apiError = parseApiError(error);
      setError("root", {
        message: apiError.status === 409
          ? "Ya existe un tipo de falla con este código o nombre. Revisa ambos datos."
          : apiError.status === 403
            ? "No tienes permiso para gestionar tipos de falla."
            : apiError.status === 404
              ? "Este tipo de falla ya no existe. Actualiza la lista."
              : apiError.status === 400
                ? "El servidor rechazó los datos. Revisa los campos e inténtalo de nuevo."
                : "No se pudo guardar la falla. Revisa tu conexión e inténtalo de nuevo.",
      });
    }
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {errors.root?.message && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-2">
          <Label htmlFor="falla-code">Código</Label>
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="falla-code" className="h-11 pl-10 font-mono uppercase"
              placeholder="MEC-FRE-01" maxLength={30} autoComplete="off" autoCapitalize="characters"
              aria-invalid={!!errors.code} aria-describedby={errors.code ? "falla-code-error" : "falla-code-help"}
              {...register("code")} />
          </div>
          <p id="falla-code-help" className="text-sm text-muted-foreground">Identifica esta falla en los reportes de flota.</p>
          {errors.code && <p id="falla-code-error" className="text-sm text-destructive">{errors.code.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="falla-name">Nombre del incidente</Label>
          <div className="relative">
            <Wrench className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="falla-name" className="h-11 pl-10" placeholder="Falla en sistema de frenos"
              maxLength={100} autoComplete="off" aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "falla-name-error" : "falla-name-help"}
              {...register("name")} />
          </div>
          <p id="falla-name-help" className="text-sm text-muted-foreground">Usa un nombre breve que el equipo reconozca en ruta.</p>
          {errors.name && <p id="falla-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="max-w-sm space-y-2">
        <Label htmlFor="falla-severity">Severidad</Label>
        <Controller control={control} name="severity" render={({ field }) => (
          <Select value={field.value ?? ""} onValueChange={(value: SeveridadIncidenteVehiculo) => field.onChange(value)}>
            <SelectTrigger id="falla-severity" className="h-11 w-full" onBlur={field.onBlur}
              aria-invalid={!!errors.severity}
              aria-describedby={errors.severity ? "falla-severity-error" : "falla-severity-help"}>
              <SelectValue placeholder="Selecciona la severidad" />
            </SelectTrigger>
            <SelectContent>
              {SEVERIDADES_INCIDENTE_VEHICULO.map((severity) => (
                <SelectItem key={severity.value} value={severity.value}>{severity.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
        <p id="falla-severity-help" className="text-sm text-muted-foreground">La severidad ayuda a priorizar la atención de la unidad.</p>
        {errors.severity && <p id="falla-severity-error" className="text-sm text-destructive">{errors.severity.message}</p>}
      </div>

      <div className="max-w-sm space-y-2">
        <Label htmlFor="falla-blocks-unit">Bloquea la unidad</Label>
        <Controller control={control} name="disablesVehicle" render={({ field }) => (
          <Select value={field.value === undefined ? "" : field.value ? "yes" : "no"}
            onValueChange={(value) => field.onChange(value === "yes")}>
            <SelectTrigger id="falla-blocks-unit" className="h-11 w-full" onBlur={field.onBlur}
              aria-invalid={!!errors.disablesVehicle}
              aria-describedby={errors.disablesVehicle ? "falla-blocks-unit-error" : "falla-blocks-unit-help"}>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Sí, bloquea la unidad</SelectItem>
              <SelectItem value="no">No bloquea la unidad</SelectItem>
            </SelectContent>
          </Select>
        )} />
        <p id="falla-blocks-unit-help" className="text-sm text-muted-foreground">
          Cuando se reporte una avería de este tipo, la unidad pasará a mantenimiento si eliges «Sí».
        </p>
        {errors.disablesVehicle && <p id="falla-blocks-unit-error" className="text-sm text-destructive">{errors.disablesVehicle.message}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : tipo ? "Guardar cambios" : "Crear tipo de falla"}
        </Button>
      </div>
    </form>
  );
}
