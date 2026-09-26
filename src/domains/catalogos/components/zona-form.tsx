import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MapPin, Timer } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { zonaSchema, type ZonaFormValues } from "../catalogos.schemas";
import type { Zona } from "../catalogos.types";

const FIELD_ICON = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export function ZonaForm({
  zona,
  onSubmit,
  onCancel,
  guardando = false,
}: {
  zona?: Zona;
  onSubmit: (values: ZonaFormValues) => Promise<void>;
  onCancel: () => void;
  guardando?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ZonaFormValues>({
    resolver: zodResolver(zonaSchema),
    defaultValues: {
      code: zona?.code ?? "",
      name: zona?.name ?? "",
      estimatedTimeMin: zona?.estimatedTimeMin ?? 45,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
        <Input
          id="zona-name"
          className="h-11"
          placeholder="Zona Sur"
          maxLength={100}
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "zona-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && <p id="zona-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : zona ? "Guardar cambios" : "Crear zona"}
        </Button>
      </div>
    </form>
  );
}
