import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Hash, ListX, LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { parseApiError } from "@/shared/lib/api-error";
import { useFormSubmitConfirmation } from "@/shared/hooks/use-form-submit-confirmation";
import { motivoReprogramacionSchema, type MotivoReprogramacionFormValues } from "../catalogos.schemas";
import type { MotivoReprogramacion, MotivoReprogramacionCategoria } from "../catalogos.types";
import { MOTIVO_REPROGRAMACION_CATEGORIAS } from "../motivos-reprogramacion.constants";

const FIELD_ICON = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export function MotivoReprogramacionForm({ motivo, onSubmit, onCancel, onDirtyChange, guardando = false }: {
  motivo?: MotivoReprogramacion;
  onSubmit: (values: MotivoReprogramacionFormValues) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  guardando?: boolean;
}) {
  const { register, control, handleSubmit, setError, formState: { errors, isDirty } } =
    useForm<MotivoReprogramacionFormValues>({
      resolver: zodResolver(motivoReprogramacionSchema),
      defaultValues: {
        code: motivo?.code ?? "",
        name: motivo?.name ?? "",
        description: motivo?.description ?? "",
        category: motivo?.category,
      },
      mode: "onTouched",
      reValidateMode: "onChange",
    });
  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);
  const confirmation = useFormSubmitConfirmation("motivo de reprogramación", !!motivo);

  const save = async (values: MotivoReprogramacionFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const apiError = parseApiError(error);
      setError("root", {
        message: apiError.code === "RESCHEDULE_REASON_CODE_ALREADY_EXISTS"
          ? "Ya existe un motivo con este nombre o código. Revisa ambos datos."
          : apiError.status === 404
            ? "Este motivo ya no existe. Actualiza la lista."
            : apiError.message,
      });
    }
  };
  const submit = handleSubmit((values) => confirmation.requestConfirmation(() => save(values)));

  return (
    <>
    <form onSubmit={submit} className="space-y-5" noValidate>
      {errors.root?.message && (
        <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription>{errors.root.message}</AlertDescription></Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-2">
          <Label htmlFor="reprogramacion-code">Código</Label>
          <div className="relative">
            <Hash className={FIELD_ICON} aria-hidden />
            <Input id="reprogramacion-code" className="h-11 pl-10 font-mono uppercase"
              placeholder="RES-CLI-EXP" maxLength={30} autoComplete="off" autoCapitalize="characters"
              aria-invalid={!!errors.code} aria-describedby={errors.code ? "reprogramacion-code-error" : "reprogramacion-code-help"}
              {...register("code")} />
          </div>
          <p id="reprogramacion-code-help" className="text-sm text-muted-foreground">Único, se guarda en mayúsculas.</p>
          {errors.code && <p id="reprogramacion-code-error" className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reprogramacion-name">Nombre</Label>
          <div className="relative">
            <ListX className={FIELD_ICON} aria-hidden />
            <Input id="reprogramacion-name" className="h-11 pl-10" placeholder="Solicitud expresa del cliente"
              maxLength={150} autoComplete="off" aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "reprogramacion-name-error" : "reprogramacion-name-help"}
              {...register("name")} />
          </div>
          <p id="reprogramacion-name-help" className="text-sm text-muted-foreground">Será visible al justificar un cambio operativo.</p>
          {errors.name && <p id="reprogramacion-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reprogramacion-description">Descripción <span className="font-normal text-muted-foreground">Opcional</span></Label>
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
          <Textarea id="reprogramacion-description" className="min-h-20 pl-10"
            placeholder="El cliente pidió cambiar la fecha de entrega" maxLength={255}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "reprogramacion-description-error" : "reprogramacion-description-help"}
            {...register("description")} />
        </div>
        <p id="reprogramacion-description-help" className="text-sm text-muted-foreground">Aclara cuándo corresponde usar este motivo.</p>
        {errors.description && <p id="reprogramacion-description-error" className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2 sm:max-w-sm">
        <Label htmlFor="reprogramacion-origin">Origen de la causa</Label>
        <Controller control={control} name="category" render={({ field }) => (
          <Select value={field.value} onValueChange={(value: MotivoReprogramacionCategoria) => field.onChange(value)}>
            <SelectTrigger id="reprogramacion-origin" className="h-11 w-full" onBlur={field.onBlur}
              aria-invalid={!!errors.category} aria-describedby={errors.category ? "reprogramacion-origin-error" : "reprogramacion-origin-help"}>
              <SelectValue placeholder="Selecciona un origen" />
            </SelectTrigger>
            <SelectContent>{MOTIVO_REPROGRAMACION_CATEGORIAS.map((origin) => (
              <SelectItem key={origin.value} value={origin.value}>{origin.label}</SelectItem>
            ))}</SelectContent>
          </Select>
        )} />
        <p id="reprogramacion-origin-help" className="text-sm text-muted-foreground">
          La categoría determina automáticamente cómo se contabiliza la puntualidad interna.
        </p>
        {errors.category && <p id="reprogramacion-origin-error" className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      <div className="form-dialog-footer flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>Cancelar</Button>
        <Button type="submit" variant={motivo ? "brandBlue" : "default"} disabled={guardando}>
          {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {guardando ? "Guardando…" : motivo ? "Guardar cambios" : "Crear motivo"}
        </Button>
      </div>
    </form>
    {confirmation.confirmationDialog}
    </>
  );
}
