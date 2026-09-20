import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, Truck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginInput } from "../auth.schemas";
import { LoginErrorAlert } from "./login-error-alert";

/** Formulario completo del login: cabecera, errores, campos y enlaces. */
export function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", totpCode: "" },
  });

  useEffect(() => { setFocus("username"); }, [setFocus]);
  useEffect(() => { if (login.needsTotp) setFocus("totpCode"); }, [login.needsTotp, setFocus]);

  const error = login.errorInfo;
  // "totp-required" no es un fallo: es una indicación, se muestra como aviso neutro.
  const hint = error?.kind === "totp-required" ? error : null;
  const failure = error && error.kind !== "totp-required" ? error : null;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden">
        <Truck className="h-6 w-6 text-primary" aria-hidden />
        delivery-dispatch
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">Ingresa con tu usuario y contraseña del sistema.</p>
      </div>

      {failure && <LoginErrorAlert error={failure} />}

      <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            autoComplete="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username")}
          />
          {errors.username && (
            <p id="username-error" className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {login.needsTotp && (
          <div className="space-y-2">
            <Label htmlFor="totpCode">Código de verificación</Label>
            <Input
              id="totpCode"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              className="text-center tracking-[0.5em]"
              aria-invalid={!!errors.totpCode}
              aria-describedby={errors.totpCode ? "totp-error" : undefined}
              {...register("totpCode")}
            />
            {errors.totpCode && (
              <p id="totp-error" className="text-xs text-destructive">{errors.totpCode.message}</p>
            )}
            {hint && <p className="text-xs text-muted-foreground">{hint.message}</p>}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          {login.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        <Link to="/recuperar-password" className="text-primary underline-offset-4 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-muted-foreground">
          ¿Eres cliente?{" "}
          <Link to="/seguimiento" className="text-primary underline-offset-4 hover:underline">
            Rastrea tu pedido
          </Link>
        </p>
      </div>
    </div>
  );
}
