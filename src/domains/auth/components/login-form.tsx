import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, ShieldCheck, Truck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginInput } from "../auth.schemas";
import { LoginErrorAlert } from "./login-error-alert";

/** 48 px (h-12): altura ergonómica con micro-interacción de foco. */
const CONTROL = "h-12 rounded-lg bg-[#f0f7fb] dark:bg-[#19303f]/50 border-[#cde0eb] dark:border-[#385464] transition-all focus-visible:ring-2 focus-visible:ring-brand-turquoise/40 focus-visible:border-brand-blue";

/** Formulario completo del login con contenedor refinado y detalles corporativos. */
export function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", totpCode: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => { setFocus("username"); }, [setFocus]);
  useEffect(() => { if (login.needsTotp) setFocus("totpCode"); }, [login.needsTotp, setFocus]);

  const error = login.errorInfo;
  const hint = error?.kind === "totp-required" ? error : null;
  const failure = error && error.kind !== "totp-required" ? error : null;

  return (
    <div className="w-full max-w-md space-y-7">
      {/* Logo corporativo solo en pantallas móviles donde el hero está oculto */}
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-blue text-white dark:text-background">
          <Truck className="size-5" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight text-brand-blue">Delivery Dispatch</span>
      </div>


      {/* Encabezado: Eyebrow + Título + Subtítulo */}
      <div className="space-y-1.5 pt-1">
        <p className="text-xs font-bold tracking-[0.2em] text-brand-blue dark:text-brand-turquoise uppercase">
          PANEL DE DESPACHOS
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Ingresa para continuar con tus envíos.
        </p>
      </div>

      {failure && <LoginErrorAlert error={failure} />}

      <form
        onSubmit={handleSubmit((v) => login.mutate(v))}
        className="space-y-4"
        aria-busy={login.isPending}
        noValidate
      >
        {/* Campo Usuario / Correo */}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-sm font-semibold text-foreground">
            Usuario (o correo electrónico)
          </Label>
          <Input
            id="username"
            className={CONTROL}
            placeholder="atorrez o tu@correo.com"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username")}
          />
          {errors.username && (
            <p id="username-error" className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        {/* Campo Contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              className={`${CONTROL} pr-11`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Fila de Utilidad: Checkbox Recordarme + Link ¿Olvidaste tu contraseña? */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label
              htmlFor="remember"
              className="cursor-pointer text-sm font-normal text-muted-foreground select-none"
            >
              Recordarme
            </Label>
          </div>
          <Link
            to="/recuperar-password"
            className="text-sm font-medium text-brand-blue hover:underline dark:text-brand-turquoise"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Campo TOTP condicional (preservado al 100%) */}
        {login.needsTotp && (
          <div className="space-y-1.5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
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
            {hint && <p id="totp-hint" className="text-xs text-muted-foreground">{hint.message}</p>}
            {errors.totpCode && (
              <p id="totp-error" className="text-xs text-destructive">{errors.totpCode.message}</p>
            )}
          </div>
        )}

        {/* Botón Principal Iniciar sesión */}
        <Button
          type="submit"
          className="h-12 w-full text-base font-semibold shadow-md shadow-brand-orange/20 transition-all hover:shadow-lg hover:shadow-brand-orange/30 cursor-pointer"
          disabled={login.isPending}
        >
          {login.isPending && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
          {login.isPending ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>
      </form>

      {/* Separador, enlace cliente y sello de seguridad */}
      <div className="space-y-4 pt-1">
        <Separator className="bg-border/60" />
        <p className="text-center text-sm text-muted-foreground">
          ¿Eres cliente?{" "}
          <Link
            to="/seguimiento"
            className="font-semibold text-brand-blue hover:underline dark:text-brand-turquoise"
          >
            Rastrea tu pedido
          </Link>
        </p>

        {/* Sello de confianza / seguridad SSL */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/75">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <span>Acceso seguro cifrado con TLS 1.3 · Grupo H</span>
        </div>
      </div>
    </div>
  );
}


