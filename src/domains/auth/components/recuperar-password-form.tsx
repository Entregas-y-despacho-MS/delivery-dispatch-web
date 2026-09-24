import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, RotateCw, Truck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { useRecuperarPassword } from "../hooks/use-recuperar-password";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../auth.schemas";

const CONTROL = "h-11";
const ICONO_CAMPO =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";
const ENLACE =
  "rounded-sm underline decoration-muted-foreground/40 underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Formulario para solicitud de enlace de recuperación de contraseña (RF-A23). */
export function RecuperarPasswordForm() {
  const recuperar = useRecuperarPassword();

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    control,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const emailValue = useWatch({ control, name: "email" });


  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const handleReintentar = () => {
    recuperar.reset();
    reset({ email: "" });
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Cabecera móvil con logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck className="size-5" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight">Delivery Dispatch</span>
      </div>

      {recuperar.isSuccess ? (
        <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
          <Alert variant="default" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <AlertTitle className="text-base font-semibold">Correo enviado</AlertTitle>
            <AlertDescription className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-300/90">
              <p>
                Si existe una cuenta asociada a <strong>{emailValue || "tu correo"}</strong>,
                hemos enviado las instrucciones para restablecer tu contraseña.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Por motivos de seguridad, el enlace temporal tiene una vigencia limitada (15 a 30 minutos).
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className={`w-full ${CONTROL}`}
              onClick={handleReintentar}
            >
              <RotateCw className="mr-2 size-4" aria-hidden />
              Ingresar otro correo
            </Button>

            <Button asChild className={`w-full ${CONTROL}`}>
              <Link to="/login">
                <ArrowLeft className="mr-2 size-4" aria-hidden />
                Volver al inicio de sesión
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa el correo electrónico de tu cuenta para recibir un enlace de restablecimiento.
            </p>
          </div>

          <form
            onSubmit={handleSubmit((data) => recuperar.mutate(data))}
            className="space-y-5"
            aria-busy={recuperar.isPending}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className={ICONO_CAMPO} aria-hidden />
                <Input
                  id="email"
                  type="email"
                  className={`${CONTROL} pl-10`}
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className={`w-full ${CONTROL}`}
              disabled={recuperar.isPending}
            >
              {recuperar.isPending && (
                <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden />
              )}
              {recuperar.isPending ? "Enviando enlace…" : "Enviar enlace de recuperación"}
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
        </>
      )}
    </div>
  );
}
