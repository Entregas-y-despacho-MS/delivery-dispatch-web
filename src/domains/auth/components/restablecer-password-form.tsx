import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  RotateCcw,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { useRestablecerPassword } from "../hooks/use-restablecer-password";
import { resetPasswordSchema, type ResetPasswordInput } from "../auth.schemas";

const CONTROL = "h-11";
const ICONO_CAMPO =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";
const ENLACE =
  "rounded-sm underline decoration-muted-foreground/40 underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

interface RestablecerPasswordFormProps {
  token: string;
}

interface Requisito {
  id: string;
  label: string;
  cumple: (pwd: string) => boolean;
}

const REQUISITOS: Requisito[] = [
  { id: "length", label: "Mínimo 8 caracteres", cumple: (p) => p.length >= 8 },
  { id: "upper", label: "Al menos una mayúscula (A-Z)", cumple: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Al menos una minúscula (a-z)", cumple: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Al menos un número (0-9)", cumple: (p) => /\d/.test(p) },
  { id: "symbol", label: "Al menos un símbolo (@$!%*?&#...)", cumple: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** Formulario para restablecer la contraseña con validación visual y token temporal (RF-A25). */
export function RestablecerPasswordForm({ token }: RestablecerPasswordFormProps) {
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const restablecer = useRestablecerPassword({
    onSuccess: () => {
      // Breve pausa para que el usuario aprecie el estado de éxito antes de redirigir
      setTimeout(() => {
        navigate("/login");
      }, 3500);
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const newPasswordValue = useWatch({ control, name: "newPassword" }) || "";
  const confirmPasswordValue = useWatch({ control, name: "confirmPassword" }) || "";


  // Si no se proporcionó ningún token en la URL
  if (!token || token.trim() === "") {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="size-5" aria-hidden />
          </span>
          <span className="text-base font-semibold tracking-tight">Delivery Dispatch</span>
        </div>

        <Alert variant="destructive">
          <XCircle className="size-5" aria-hidden />
          <AlertTitle className="text-base font-semibold">Enlace incompleto o inválido</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-sm">
            <p>
              No se detectó un token de seguridad en la dirección web. Asegúrate de hacer clic
              en el enlace completo recibido en tu correo electrónico.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button asChild className={`w-full ${CONTROL}`}>
            <Link to="/forgot-password">
              <RotateCcw className="mr-2 size-4" aria-hidden />
              Solicitar nuevo enlace
            </Link>
          </Button>

          <Button asChild variant="outline" className={`w-full ${CONTROL}`}>
            <Link to="/login">
              <ArrowLeft className="mr-2 size-4" aria-hidden />
              Volver al inicio de sesión
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Si la actualización fue exitosa
  if (restablecer.isSuccess) {
    return (
      <div className="w-full max-w-sm space-y-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="size-5" aria-hidden />
          </span>
          <span className="text-base font-semibold tracking-tight">Delivery Dispatch</span>
        </div>

        <Alert variant="default" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <AlertTitle className="text-base font-semibold">¡Contraseña restablecida!</AlertTitle>
          <AlertDescription className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-300/90">
            <p>
              Tu nueva contraseña ha sido configurada con éxito. Ya puedes ingresar al portal con
              tus nuevas credenciales.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Redirigiendo automáticamente al login en unos segundos…
            </p>
          </AlertDescription>
        </Alert>

        <Button asChild className={`w-full ${CONTROL}`}>
          <Link to="/login">
            <KeyRound className="mr-2 size-4" aria-hidden />
            Ir a Iniciar Sesión
          </Link>
        </Button>
      </div>
    );
  }

  const errorInfo = restablecer.errorInfo;

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Cabecera móvil con logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck className="size-5" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight">Delivery Dispatch</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Restablecer contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa una nueva contraseña segura para tu cuenta de usuario.
        </p>
      </div>

      {/* Alerta de error proveniente del servidor (ej. token vencido o clave usada) */}
      {errorInfo && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <XCircle className="size-5" aria-hidden />
          <AlertTitle>{errorInfo.title}</AlertTitle>
          <AlertDescription className="mt-1 space-y-2 text-sm">
            <p>{errorInfo.message}</p>
            {errorInfo.isTokenExpired && (
              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/forgot-password">
                    <RotateCcw className="mr-2 size-3.5" aria-hidden />
                    Solicitar un nuevo enlace
                  </Link>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit((data) => restablecer.mutate(data))}
        className="space-y-5"
        aria-busy={restablecer.isPending}
        noValidate
      >
        <input type="hidden" {...register("token")} value={token} />

        {/* Campo Nueva Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <div className="relative">
            <Lock className={ICONO_CAMPO} aria-hidden />
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              className={`${CONTROL} pl-10 pr-11`}
              placeholder="••••••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
              {...register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showNewPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {showNewPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p id="newPassword-error" className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Validación visual de robustez de contraseña */}
        <div className="rounded-md border bg-muted/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Requisitos de seguridad (RF-A25)
          </p>
          <ul className="space-y-1.5 text-xs">
            {REQUISITOS.map((req) => {
              const cumple = req.cumple(newPasswordValue);
              return (
                <li
                  key={req.id}
                  className={`flex items-center gap-2 transition-colors ${
                    cumple
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {cumple ? (
                    <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <X className="size-3.5 shrink-0 text-muted-foreground/60" />
                  )}
                  <span>{req.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Campo Confirmar Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <div className="relative">
            <Lock className={ICONO_CAMPO} aria-hidden />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className={`${CONTROL} pl-10 pr-11`}
              placeholder="••••••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showConfirmPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
          {confirmPasswordValue && newPasswordValue === confirmPasswordValue && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="size-3.5" /> Las contraseñas coinciden
            </p>
          )}
        </div>

        <Button
          type="submit"
          className={`w-full ${CONTROL}`}
          disabled={restablecer.isPending}
        >
          {restablecer.isPending && (
            <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden />
          )}
          {restablecer.isPending ? "Actualizando contraseña…" : "Restablecer contraseña"}
        </Button>
      </form>

      <div className="space-y-4">
        <Separator />
        <div className="text-center">
          <Link
            to="/login"
            className={`inline-flex items-center text-sm font-medium text-foreground ${ENLACE}`}
          >
            <ArrowLeft className="mr-1.5 size-4" aria-hidden />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
