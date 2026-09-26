import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, Lock, Truck, User } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginInput } from "../auth.schemas";
import { LoginErrorAlert } from "./login-error-alert";

/** 44 px: objetivo táctil cómodo para los controles principales del formulario. */
const CONTROL = "h-11";

/** Icono que anticipa el contenido del campo. Decorativo: el label ya lo nombra. */
const ICONO_CAMPO =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

/** Enlace secundario: sin naranja, que queda reservado a la acción principal. */
const ENLACE =
  "rounded-sm underline decoration-muted-foreground/40 underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Formulario completo del login: cabecera, errores, campos y enlaces. */
export function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", totpCode: "" },
    // El error aparece al salir del campo, no mientras se escribe; una vez visible,
    // se revalida en cada cambio para que la corrección se confirme sola.
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => { setFocus("username"); }, [setFocus]);
  useEffect(() => { if (login.needsTotp) setFocus("totpCode"); }, [login.needsTotp, setFocus]);

  const error = login.errorInfo;
  // "totp-required" no es un fallo: es una indicación, se muestra como aviso neutro.
  const hint = error?.kind === "totp-required" ? error : null;
  const failure = error && error.kind !== "totp-required" ? error : null;

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck className="size-5" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight">Delivery Dispatch</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa con tu usuario y contraseña del sistema.
        </p>
      </div>

      {failure && <LoginErrorAlert error={failure} />}

      <form
        onSubmit={handleSubmit((v) => login.mutate(v))}
        className="space-y-5"
        aria-busy={login.isPending}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <div className="relative">
            <User className={ICONO_CAMPO} aria-hidden />
            <Input
              id="username"
              className={`${CONTROL} pl-10`}
              placeholder="atorrez"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              {...register("username")}
            />
          </div>
          {errors.username && (
            <p id="username-error" className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="/recuperar-password" className={`text-sm text-muted-foreground ${ENLACE}`}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className={ICONO_CAMPO} aria-hidden />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${CONTROL} pl-10 pr-11`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {login.needsTotp && (
          <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
            <Label htmlFor="totpCode">Código de verificación</Label>
            <Input
              id="totpCode"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              className={`${CONTROL} text-center text-base tracking-[0.5em] tabular-nums`}
              aria-invalid={!!errors.totpCode}
              aria-describedby={`${errors.totpCode ? "totp-error" : ""} ${hint ? "totp-hint" : ""}`.trim() || undefined}
              {...register("totpCode")}
            />
            {hint && <p id="totp-hint" className="text-sm text-muted-foreground">{hint.message}</p>}
            {errors.totpCode && (
              <p id="totp-error" className="text-sm text-destructive">{errors.totpCode.message}</p>
            )}
          </div>
        )}

        <Button type="submit" className={`w-full ${CONTROL}`} disabled={login.isPending}>
          {login.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {login.isPending ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="space-y-4">
        <Separator />
        <p className="text-sm text-muted-foreground">
          ¿Eres cliente?{" "}
          <Link to="/seguimiento" className={`font-medium text-foreground ${ENLACE}`}>
            Rastrea tu pedido
          </Link>{" "}
          con el código de seguimiento, sin iniciar sesión.
        </p>
      </div>
    </div>
  );
}
