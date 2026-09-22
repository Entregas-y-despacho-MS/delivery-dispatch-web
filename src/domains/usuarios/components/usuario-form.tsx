import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle, Eye, EyeOff, LoaderCircle, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
  const [verPassword, setVerPassword] = useState(false);

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

  const enviar = handleSubmit((values) =>
    guardar.mutate(values, {
      // El backend no dice cuál de los dos choca: se lleva al usuario al primero.
      onError: (error) => {
        if (describeUsuarioError(error).kind === "duplicado") setFocus("username");
      },
    })
  );

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {guardar.errorInfo && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" aria-hidden />
          <AlertDescription>{guardar.errorInfo.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          autoComplete="off"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          {...register("fullName")}
        />
        {errors.fullName && <p id="fullName-error" className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          autoComplete="off"
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "username-error" : undefined}
          {...register("username")}
        />
        {errors.username && <p id="username-error" className="text-xs text-destructive">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo (opcional)</Label>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && <p id="email-error" className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleId">Rol</Label>
        <Controller
          control={control}
          name="roleId"
          render={({ field }) => (
            <RolSelector
              id="roleId"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              roles={roles.data}
              loading={roles.isPending}
              invalid={!!errors.roleId}
              describedBy={errors.roleId ? "roleId-error" : undefined}
            />
          )}
        />
        {errors.roleId && <p id="roleId-error" className="text-xs text-destructive">{errors.roleId.message}</p>}
        {roles.isError && (
          <p className="text-xs text-destructive">
            No se pudieron cargar los roles.{" "}
            <button type="button" className="underline underline-offset-4" onClick={() => roles.refetch()}>
              Reintentar
            </button>
          </p>
        )}
      </div>

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
                  {cumple ? <Check className="h-3 w-3 text-primary" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
                  <span>{regla.etiqueta}</span>
                  <span className="sr-only">{cumple ? "(cumplido)" : "(pendiente)"}</span>
                </li>
              );
            })}
          </ul>
          <div className="relative">
            <Input
              id="password"
              type={verPassword ? "text" : "password"}
              autoComplete="new-password"
              className="pr-10"
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

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          {guardar.isPending ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
