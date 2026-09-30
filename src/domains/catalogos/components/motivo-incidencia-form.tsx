import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Hash, ListX, LoaderCircle, Power, TriangleAlert } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { parseApiError } from "@/shared/lib/api-error";
import { motivoIncidenciaSchema, type MotivoIncidenciaFormValues } from "../catalogos.schemas";
import type { MotivoIncidencia } from "../catalogos.types";

const FIELD_ICON = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export function MotivoIncidenciaForm({
  motivo,
  onSubmit,
  onCancel,
  guardando = false,
}: {
  motivo?: MotivoIncidencia;
  onSubmit: (values: MotivoIncidenciaFormValues) => Promise<void>;
  onCancel: () => void;
  guardando?: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<MotivoIncidenciaFormValues>({
    resolver: zodResolver(motivoIncidenciaSchema),
    defaultValues: {
      code: motivo?.code ?? "",
      name: motivo?.name ?? "",
      requiresEvidence: motivo?.requiresEvidence ?? false,
      active: motivo?.active ?? true,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError.code === "INCIDENT_REASON_CODE_ALREADY_EXISTS") {
        setError("code", { message: "Ya existe un motivo con este código." });
        setFocus("code");
        return;
      }

      setError("root", {
        message: apiError.status === 404
          ? "Este motivo ya no existe. Actualiza la lista."
          : apiError.message,
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
          <Label htmlFor="motivo-code">Código</Label>
          <div className="relative">
            <Hash className={FIELD_ICON} aria-hidden />
            <Input
              id="motivo-code"
              className="h-11 pl-10 font-mono uppercase"
              placeholder="INC-CLI-AUS"
              maxLength={30}
              autoComplete="off"
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "motivo-code-error" : "motivo-code-help"}
              {...register("code")}
            />
          </div>
          <p id="motivo-code-help" className="text-sm text-muted-foreground">Único, se guarda en mayúsculas.</p>
          {errors.code && <p id="motivo-code-error" className="text-sm text-destructive">{errors.code.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivo-name">Nombre</Label>
          <div className="relative">
            <ListX className={FIELD_ICON} aria-hidden />
            <Input
              id="motivo-name"
              className="h-11 pl-10"
              placeholder="Cliente ausente"
              maxLength={150}
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "motivo-name-error" : "motivo-name-help"}
              {...register("name")}
            />
          </div>
          <p id="motivo-name-help" className="text-sm text-muted-foreground">Es lo que verá el repartidor en la app.</p>
          {errors.name && <p id="motivo-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <Controller
          control={control}
          name="requiresEvidence"
          render={({ field }) => (
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="motivo-evidence" className="flex items-center gap-2">
                  <Camera className="size-4 text-muted-foreground" aria-hidden />
                  Requiere foto de evidencia
                </Label>
                <p id="motivo-evidence-help" className="text-sm text-muted-foreground">
                  {field.value
                    ? "El repartidor no podrá reportar la incidencia sin tomar una foto."
                    : "La foto será opcional al reportar la incidencia."}
                </p>
              </div>
              <Switch
                id="motivo-evidence"
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                aria-describedby="motivo-evidence-help"
              />
            </div>
          )}
        />

        {/* El backend no acepta `active` al crear: el estado solo se edita en motivos existentes. */}
        {motivo && (
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="motivo-active" className="flex items-center gap-2">
                    <Power className="size-4 text-muted-foreground" aria-hidden />
                    Motivo activo
                  </Label>
                  <p id="motivo-active-help" className="text-sm text-muted-foreground">
                    {field.value
                      ? "Se ofrece a los repartidores al reportar incidencias."
                      : "No se ofrecerá en nuevas incidencias. Las ya registradas no cambian."}
                  </p>
                </div>
                <Switch
                  id="motivo-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-describedby="motivo-active-help"
                />
              </div>
            )}
          />
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : motivo ? "Guardar cambios" : "Crear motivo"}
        </Button>
      </div>
    </form>
  );
}
