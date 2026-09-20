import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, MapPin, Truck, TriangleAlert } from "lucide-react";

import { useLogin, useLoginDestination, loginSchema, type LoginInput } from "@/domains/auth";
import { hasRole, ROLES_WEB } from "@/config/roles";
import { useAuthHydrated } from "@/shared/hooks/use-hydrated";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export default function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const login = useLogin();
  const destination = useLoginDestination();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", totpCode: "" },
  });

  useEffect(() => { setFocus("username"); }, [setFocus]);
  useEffect(() => { if (login.needsTotp) setFocus("totpCode"); }, [login.needsTotp, setFocus]);

  // Si ya hay sesión válida no tiene sentido ver el login.
  if (hydrated && user && hasRole(user.rol.id, ROLES_WEB)) {
    return <Navigate to={destination} replace />;
  }

  const error = login.errorInfo;
  const locked = error?.kind === "locked";
  // "totp-required" no es un fallo: es una indicación, se muestra como aviso neutro.
  const hint = error?.kind === "totp-required" ? error : null;
  const failure = error && error.kind !== "totp-required" ? error : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca: solo en pantallas grandes */}
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Truck className="h-6 w-6" aria-hidden />
          delivery-dispatch
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Cada despacho, en su lugar y a tiempo.
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Planifica rutas, controla la flota y da seguimiento a las entregas de la cadena desde un solo panel.
          </p>
        </div>

        <p className="flex items-center gap-2 text-sm text-primary-foreground/70">
          <MapPin className="h-4 w-4" aria-hidden />
          ERP corporativo · Gestión de Entregas y Despachos
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden">
            <Truck className="h-6 w-6 text-primary" aria-hidden />
            delivery-dispatch
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground">Ingresa con tu usuario y contraseña del sistema.</p>
          </div>

          {failure && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {locked
                ? <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              <div>
                {locked && <p className="font-medium">Cuenta bloqueada</p>}
                <p>{failure.message}</p>
              </div>
            </div>
          )}

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
      </main>
    </div>
  );
}
