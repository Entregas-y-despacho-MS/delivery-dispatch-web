import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Check, Circle, Eye, EyeOff, Info, KeyRound, LoaderCircle, Mail, ShieldCheck, TriangleAlert, UserRound } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { useFormSubmitConfirmation } from "@/shared/hooks/use-form-submit-confirmation";
import { useGuardarUsuario } from "../hooks/use-usuarios";
import { useRoles } from "../hooks/use-roles";
import { describeUsuarioError } from "../usuarios.errors";
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  REGLAS_PASSWORD,
  type UsuarioFormValues,
} from "../usuarios.schemas";
import type { Usuario } from "../usuarios.types";
import { PermisosRolPanel } from "./permisos-rol-panel";
import { RolSelector } from "./rol-selector";

interface UsuarioFormProps {
  /** null = alta de un usuario nuevo. Con un usuario, el formulario abre en modo edición con sus datos. */
  usuario: Usuario | null;
  onGuardado: () => void;
  onCancelar: () => void;
}

/** Formulario de alta y edición de usuarios internos. */
export function UsuarioForm({ usuario, onGuardado, onCancelar }: UsuarioFormProps) {
  const editando = usuario !== null;
  const roles = useRoles();
  const guardar = useGuardarUsuario(usuario, onGuardado);
  const confirmation = useFormSubmitConfirmation("usuario", editando);
  const [verPassword, setVerPassword] = useState(false);
  // Nadie puede cambiar su propio rol (el backend responde 403 CANNOT_MODIFY_OWN_ACCOUNT).
  const miId = useAuthStore((s) => s.user?.id);
  const esPropiaCuenta = editando && miId === String(usuario.id);

  const {
    register,
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(editando ? editarUsuarioSchema : crearUsuarioSchema),
    // Los errores aparecen cuando el usuario sale del campo o intenta enviar, no mientras escribe.
    mode: "onTouched",
    defaultValues: {
      fullName: usuario?.nombreCompleto ?? "",
      username: usuario?.username ?? "",
      email: usuario?.email ?? "",
      password: "",
      roleId: usuario ? String(usuario.rol.id) : "",
    },
  });

  const password = useWatch({ control, name: "password" });
  const roleIdElegido = useWatch({ control, name: "roleId" });
  const rolElegido = roles.data?.find((r) => String(r.id) === roleIdElegido)
    // Al editar, el rol actual puede no estar entre los asignables (ej. un usuario root).
    ?? (usuario && String(usuario.rol.id) === roleIdElegido ? usuario.rol : undefined);
  const cambiaRol = editando && roleIdElegido !== "" && roleIdElegido !== String(usuario.rol.id);

  const enviar = handleSubmit((values) => confirmation.requestConfirmation(async () => {
    await guardar.mutateAsync(values, {
      // El backend no dice cuál de los dos choca: se lleva al usuario al primero.
      onError: (error) => {
        if (describeUsuarioError(error).kind === "duplicado") setFocus("username");
      },
    });
  }));

  return (
    <>
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {guardar.errorInfo && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" aria-hidden />
          <AlertDescription>{guardar.errorInfo.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <div className="form-dialog-field relative">
            <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="fullName"
              className="h-11 pl-10"
              placeholder="Ana Pérez"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && <p id="fullName-error" className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo <span className="font-normal text-muted-foreground">Opcional</span></Label>
          <div className="form-dialog-field relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="email"
              type="email"
              className="h-11 pl-10"
              placeholder="ana@empresa.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </div>
          {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <div className="form-dialog-field relative">
            <AtSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="username"
              className="h-11 pl-10"
              placeholder="atorrez"
              autoComplete="username"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              {...register("username")}
            />
          </div>
          {errors.username && <p id="username-error" className="text-sm text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleId">Rol</Label>
          <div className="form-dialog-field relative">
            <ShieldCheck className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <RolSelector
                  id="roleId"
                  className="pl-10"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  roles={roles.data}
                  loading={roles.isPending}
                  disabled={esPropiaCuenta}
                  invalid={!!errors.roleId}
                  describedBy={errors.roleId ? "roleId-error" : esPropiaCuenta ? "roleId-propio" : undefined}
                />
              )}
            />
          </div>
          {errors.roleId && <p id="roleId-error" className="text-sm text-destructive">{errors.roleId.message}</p>}
          {esPropiaCuenta && (
            <p id="roleId-propio" className="text-sm text-muted-foreground">
              No puedes cambiar el rol de tu propia cuenta. Pídeselo a otro administrador.
            </p>
          )}
          {cambiaRol && (
            <p className="flex items-start gap-1.5 text-sm text-warning" role="status">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Al guardar, este usuario deberá ingresar de nuevo para renovar su sesión con el nuevo rol.
            </p>
          )}
          {roles.isError && (
            <p className="text-sm text-destructive">
              No se pudieron cargar los roles.{" "}
              <button type="button" className="underline underline-offset-4" onClick={() => roles.refetch()}>
                Reintentar
              </button>
            </p>
          )}
        </div>
      </div>

      <PermisosRolPanel rolNombre={rolElegido?.nombre} />

      {/* La contraseña solo se define al crear: cambiarla después tiene su propio flujo. */}
      {!editando && (
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña inicial</Label>
          {/* Los requisitos van ANTES del campo para que el teclado del móvil no los tape. */}
          <ul id="password-reglas" className="space-y-1 text-xs text-muted-foreground">
            {REGLAS_PASSWORD.map((regla) => {
              const cumple = regla.cumple(password);
              return (
                <li key={regla.id} className="flex items-center gap-2">
                  {cumple ? <Check className="h-3 w-3 text-brand-turquoise" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
                  <span>{regla.etiqueta}</span>
                  <span className="sr-only">{cumple ? "(cumplido)" : "(pendiente)"}</span>
                </li>
              );
            })}
          </ul>
          <div className="form-dialog-field relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="password"
              type={verPassword ? "text" : "password"}
              autoComplete="new-password"
              className="h-11 pr-10 pl-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-reglas password-error" : "password-reglas"}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={verPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {verPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {errors.password && <p id="password-error" className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
      )}

      <div className="form-dialog-footer flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" variant={editando ? "brandBlue" : "default"} disabled={guardar.isPending}>
          {guardar.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          {guardar.isPending ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
    {confirmation.confirmationDialog}
    </>
  );
}
