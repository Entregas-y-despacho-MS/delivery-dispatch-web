import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Gauge, ListOrdered, LoaderCircle, Timer, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { parseApiError } from "@/shared/lib/api-error";
import { nivelServicioSchema, type NivelServicioFormValues } from "../catalogos.schemas";
import type { NivelServicio } from "../catalogos.types";

const FIELD_ICON = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export function NivelServicioForm({
  nivel,
  onSubmit,
  onCancel,
  guardando = false,
}: {
  nivel?: NivelServicio;
  onSubmit: (values: NivelServicioFormValues) => Promise<void>;
  onCancel: () => void;
  guardando?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<NivelServicioFormValues>({
    resolver: zodResolver(nivelServicioSchema),
    defaultValues: {
      name: nivel?.name ?? "",
      description: nivel?.description ?? "",
      targetTimeMin: nivel?.targetTimeMin ?? 120,
      priorityLevel: nivel?.priorityLevel ?? 1,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError.code === "SERVICE_LEVEL_NAME_ALREADY_EXISTS") {
        setError("name", { message: "Ya existe un nivel de servicio con este nombre." });
        setFocus("name");
        return;
      }

      setError("root", {
        message: apiError.status === 400
          ? `El servidor rechazó los datos: ${apiError.message}`
          : apiError.status === 403
            ? "No tienes permiso para gestionar niveles de servicio."
            : apiError.status === 404
              ? "Este nivel ya no existe. Actualiza la lista."
              : "No se pudo guardar el nivel. Revisa tu conexión e inténtalo de nuevo.",
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

      <div className="space-y-2">
        <Label htmlFor="nivel-name">Nombre</Label>
        <div className="relative">
          <Gauge className={FIELD_ICON} aria-hidden />
          <Input
            id="nivel-name"
            className="h-11 pl-10"
            placeholder="Express 2 horas"
            maxLength={50}
            autoComplete="off"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "nivel-name-error" : "nivel-name-help"}
            {...register("name")}
          />
        </div>
        <p id="nivel-name-help" className="text-sm text-muted-foreground">Debe ser único dentro del catálogo.</p>
        {errors.name && <p id="nivel-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nivel-time">Tiempo objetivo</Label>
          <div className="relative">
            <Timer className={FIELD_ICON} aria-hidden />
            <Input
              id="nivel-time"
              type="number"
              inputMode="numeric"
              min={15}
              max={43200}
              step={1}
              className="h-11 pl-10 pr-14 tabular-nums"
              placeholder="120"
              aria-invalid={!!errors.targetTimeMin}
              aria-describedby={errors.targetTimeMin ? "nivel-time-error" : "nivel-time-help"}
              {...register("targetTimeMin", { valueAsNumber: true })}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">min</span>
          </div>
          <p id="nivel-time-help" className="text-sm text-muted-foreground">Entre 15 minutos y 30 días.</p>
          {errors.targetTimeMin && <p id="nivel-time-error" className="text-sm text-destructive">{errors.targetTimeMin.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nivel-priority">Prioridad</Label>
          <div className="relative">
            <ListOrdered className={FIELD_ICON} aria-hidden />
            <Input
              id="nivel-priority"
              type="number"
              inputMode="numeric"
              min={1}
              max={32767}
              step={1}
              className="h-11 pl-10 tabular-nums"
              placeholder="1"
              aria-invalid={!!errors.priorityLevel}
              aria-describedby={errors.priorityLevel ? "nivel-priority-error" : "nivel-priority-help"}
              {...register("priorityLevel", { valueAsNumber: true })}
            />
          </div>
          <p id="nivel-priority-help" className="text-sm text-muted-foreground">1 es la prioridad más alta. Se permiten valores repetidos.</p>
          {errors.priorityLevel && <p id="nivel-priority-error" className="text-sm text-destructive">{errors.priorityLevel.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nivel-description">Descripción <span className="font-normal text-muted-foreground">Opcional</span></Label>
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
          <Textarea
            id="nivel-description"
            className="min-h-24 pl-10"
            placeholder="Entrega prioritaria en 2 horas"
            maxLength={255}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "nivel-description-error" : "nivel-description-help"}
            {...register("description")}
          />
        </div>
        <p id="nivel-description-help" className="text-sm text-muted-foreground">Ayuda al equipo a elegir el nivel correcto.</p>
        {errors.description && <p id="nivel-description-error" className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : nivel ? "Guardar cambios" : "Crear nivel"}
        </Button>
      </div>
    </form>
  );
}
