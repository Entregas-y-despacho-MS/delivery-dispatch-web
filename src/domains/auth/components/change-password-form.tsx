import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, LoaderCircle, Lock, LogOut, Truck } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useLogout } from "../hooks/use-logout";
import { useChangePassword } from "../hooks/use-change-password";
import { changePasswordSchema, type ChangePasswordInput } from "../auth.schemas";
import { describeChangePasswordError } from "../auth.errors";
import { PasswordRequirements } from "./password-requirements";

type PasswordFieldName = "currentPassword" | "newPassword" | "confirmPassword";

const PASSWORD_FIELDS: { name: PasswordFieldName; label: string; autoComplete: string }[] = [
  { name: "currentPassword", label: "Contraseña actual", autoComplete: "current-password" },
  { name: "newPassword", label: "Nueva contraseña", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirmar nueva contraseña", autoComplete: "new-password" },
];

export function ChangePasswordForm() {
  const change = useChangePassword();
  const logout = useLogout();
  const [visible, setVisible] = useState<Record<PasswordFieldName, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const { register, handleSubmit, control, setFocus, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const newPassword = useWatch({ control, name: "newPassword" }) || "";
  const serverError = change.error ? describeChangePasswordError(change.error) : null;

  useEffect(() => { setFocus("currentPassword"); }, [setFocus]);

  return (
    <div className="w-full max-w-sm space-y-7">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-blue text-white dark:text-background">
          <Truck className="size-5" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight">Delivery Dispatch</span>
      </div>

      <div className="space-y-2">
        <div className="flex size-10 items-center justify-center rounded-md bg-warning/10 text-warning">
          <KeyRound className="size-5" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Cambia tu contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Debes actualizarla antes de entrar al panel. Al terminar, inicia sesión con la nueva contraseña.
        </p>
      </div>

      {serverError && !serverError.field && (
        <Alert variant="destructive" id="change-password-error">
          <AlertDescription>{serverError.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit((values) => change.mutate(values))} className="space-y-5" aria-busy={change.isPending} noValidate>
        {PASSWORD_FIELDS.map(({ name, label, autoComplete }) => {
          const fieldError = errors[name]?.message || (serverError?.field === name ? serverError.message : undefined);
          const fieldId = `${name}-change`;
          const errorId = `${fieldId}-error`;
          return (
            <div key={name} className="space-y-2">
              <Label htmlFor={fieldId}>{label}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id={fieldId}
                  type={visible[name] ? "text" : "password"}
                  className="h-11 pl-10 pr-11"
                  autoComplete={autoComplete}
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? errorId : undefined}
                  disabled={change.isPending}
                  {...register(name, { onChange: () => { if (!change.isPending) change.reset(); } })}
                />
                <button
                  type="button"
                  onClick={() => setVisible((current) => ({ ...current, [name]: !current[name] }))}
                  aria-label={visible[name] ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                  aria-pressed={visible[name]}
                  disabled={change.isPending}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {visible[name] ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
              {fieldError && <p id={errorId} className="text-sm text-destructive">{fieldError}</p>}
              {name === "newPassword" && <PasswordRequirements password={newPassword} />}
            </div>
          );
        })}

        <Button type="submit" className="h-11 w-full" disabled={change.isPending}>
          {change.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {change.isPending ? "Actualizando contraseña…" : "Actualizar contraseña"}
        </Button>
      </form>

      <Button type="button" variant="outline" className="h-11 w-full" onClick={logout} disabled={change.isPending}>
        <LogOut className="size-4" aria-hidden />
        Cerrar sesión
      </Button>
    </div>
  );
}
