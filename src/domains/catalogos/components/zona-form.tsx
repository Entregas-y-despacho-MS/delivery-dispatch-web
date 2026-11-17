import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MapPin, Timer } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { parseApiError } from "@/shared/lib/api-error";
import { useFormSubmitConfirmation } from "@/shared/hooks/use-form-submit-confirmation";
import { zonaSchema, type ZonaFormValues } from "../schemas/catalogos.schemas";
import type { Zona } from "../types/catalogos.types";
import { ZonaCoberturaEditor } from "./zona-cobertura-editor";

const FIELD_ICON = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export function ZonaForm({
  zona,
  onSubmit,
  onCancel,
  onDirtyChange,
  guardando = false,
}: {
  zona?: Zona;
  onSubmit: (values: ZonaFormValues) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  guardando?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ZonaFormValues>({
    resolver: zodResolver(zonaSchema),
    defaultValues: {
      code: zona?.code ?? "",
      name: zona?.name ?? "",
      estimatedTimeMin: zona?.estimatedTimeMin ?? 45,
      boundary: zona?.boundary ?? null,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);
  const confirmation = useFormSubmitConfirmation("zona", !!zona);

  const save = async (values: ZonaFormValues) => {
    if (!values.boundary?.length) {
      setError("root", { message: "Define la cobertura de reparto antes de guardar la zona." });
      return;
    }
    try {
      await onSubmit({ ...values, boundary: values.boundary });
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.code === "DELIVERY_ZONE_CODE_ALREADY_EXISTS") {
        setError("code", { message: "Ya existe una zona con este código." });
        setFocus("code");
        return;
      }
      setError("root", { message: parsed.message });
    }
  };
  const submit = handleSubmit((values) => confirmation.requestConfirmation(() => save(values)));

  return (
    <>
    <form onSubmit={submit} className="space-y-5" noValidate>
      {errors.root?.message && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="zona-code">Código</Label>
          <div className="relative">
            <MapPin className={FIELD_ICON} aria-hidden />
            <Input
              id="zona-code"
              className="h-11 pl-10 font-mono uppercase"
              placeholder="ZON-SUR"
              maxLength={20}
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "zona-code-error" : "zona-code-help"}
              {...register("code")}
            />
          </div>
          <p id="zona-code-help" className="text-sm text-muted-foreground">
            Debe ser único y tener hasta 20 caracteres.
          </p>
          {errors.code && <p id="zona-code-error" className="text-sm text-destructive">{errors.code.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zona-time">Tiempo estimado</Label>
          <div className="relative">
            <Timer className={FIELD_ICON} aria-hidden />
            <Input
              id="zona-time"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="h-11 pl-10 pr-14 tabular-nums"
              placeholder="45"
              aria-invalid={!!errors.estimatedTimeMin}
              aria-describedby={errors.estimatedTimeMin ? "zona-time-error" : "zona-time-help"}
              {...register("estimatedTimeMin")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              min
            </span>
          </div>
          <p id="zona-time-help" className="text-sm text-muted-foreground">Tiempo base para planificar la entrega.</p>
          {errors.estimatedTimeMin && (
            <p id="zona-time-error" className="text-sm text-destructive">{errors.estimatedTimeMin.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zona-name">Nombre</Label>
        <div className="relative">
          <MapPin className={FIELD_ICON} aria-hidden />
          <Input
            id="zona-name"
            className="h-11 pl-10"
            placeholder="Zona Sur"
            maxLength={100}
            autoComplete="off"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "zona-name-error" : undefined}
            {...register("name")}
          />
        </div>
        {errors.name && <p id="zona-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="border-t pt-5">
        <ZonaCoberturaEditor
          value={watch("boundary") ?? null}
          onChange={(boundary) => setValue("boundary", boundary, { shouldDirty: true, shouldValidate: true })}
          disabled={guardando}
        />
      </div>

      <div className="form-dialog-footer flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" variant={zona ? "brandBlue" : "default"} disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : zona ? "Guardar cambios" : "Crear zona"}
        </Button>
      </div>
    </form>
    {confirmation.confirmationDialog}
    </>
  );
}
