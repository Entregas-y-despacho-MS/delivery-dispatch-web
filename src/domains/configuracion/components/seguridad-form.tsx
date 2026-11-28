import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { passwordRequirements, passwordSettingsSchema, type PasswordKey, type PasswordValues } from "../configuracion.seguridad";

const TOGGLES: { key: PasswordKey; label: string }[] = [
  { key: "password_require_uppercase", label: "Mayúscula" },
  { key: "password_require_lowercase", label: "Minúscula" },
  { key: "password_require_number", label: "Número" },
  { key: "password_require_symbol", label: "Símbolo" },
];

export function SeguridadForm({
  valores, onGuardar, guardando,
}: {
  valores: PasswordValues;
  onGuardar: (values: PasswordValues) => Promise<string | null>;
  guardando: boolean;
}) {
  const { register, handleSubmit, setValue, watch, reset, setError, formState: { errors, isDirty, isValid } } = useForm<PasswordValues>({
    values: valores,
    resolver: zodResolver(passwordSettingsSchema),
    mode: "onChange",
  });
  // oxlint-disable-next-line react/incompatible-library -- React Hook Form owns field registration and validation state.
  const actuales = watch();
  const preview = useMemo(() => passwordRequirements(actuales), [actuales]);
  const enviar = handleSubmit(async (values) => {
    const error = await onGuardar(values);
    if (error) setError("root", { message: error });
  });

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <section className="space-y-5 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">Política de contraseñas</h2>
          <p className="text-sm text-muted-foreground">Se aplicará al crear o cambiar credenciales después de guardar.</p>
        </div>
        {errors.root?.message && <Alert variant="destructive"><AlertDescription>{errors.root.message}</AlertDescription></Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          {([
            ["password_min_length", "Longitud mínima", "caracteres", 8, 128],
            ["password_expiration_days", "Vencimiento", "días", 1, 3650],
          ] as const).map(([key, label, unit, min, max]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} inputMode="numeric" aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : `${key}-help`} {...register(key)} />
              {errors[key] ? <p id={`${key}-error`} role="alert" className="text-sm text-destructive">{errors[key].message}</p>
                : <p id={`${key}-help`} className="text-sm text-muted-foreground">{min} a {max} {unit}.</p>}
            </div>
          ))}
        </div>
        <fieldset className="space-y-2">
          <legend className="font-medium">Complejidad exigida</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOGGLES.map(({ key, label }) => (
              <label key={key} className="flex min-h-11 items-center gap-3 rounded-lg border px-3">
                <input type="checkbox" checked={actuales[key] === "true"}
                  onChange={(event) => setValue(key, event.target.checked ? "true" : "false", { shouldDirty: true, shouldValidate: true })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rounded-lg bg-muted p-4" aria-live="polite">
          <p className="font-medium">Vista previa de requisitos efectivos</p>
          <p className="text-sm text-muted-foreground">{preview.join(", ")}. Vence en {actuales.password_expiration_days} días.</p>
        </div>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={!isDirty || guardando} onClick={() => reset(valores)}>Descartar</Button>
        <Button type="submit" disabled={!isDirty || !isValid || guardando}>
          {guardando ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {guardando ? "Guardando…" : "Guardar política"}
        </Button>
      </div>
    </form>
  );
}
