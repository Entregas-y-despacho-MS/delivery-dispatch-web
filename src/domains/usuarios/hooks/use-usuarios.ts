import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeDesactivacionError, describeUsuarioError } from "../usuarios.errors";
import type { UsuarioFormValues } from "../usuarios.schemas";
import { toActualizarPayload, toCrearPayload, usuariosService } from "../services/usuarios.service";
import type { Usuario, UsuariosFiltrosParams, UsuariosPagina } from "../usuarios.types";

export const USUARIOS_QUERY_KEY = ["usuarios"] as const;

/** Lista de usuarios internos con soporte para filtros y paginación server-side. */
export function useUsuarios(params?: UsuariosFiltrosParams) {
  return useQuery({
    queryKey: ["usuarios", params] as const,
    queryFn: () => usuariosService.list(params),
  });
}

/**
 * Alta y edición en un solo hook: el formulario le pasa el usuario original al editar
 * y no sabe nada de axios ni de qué se manda al backend.
 */
export function useGuardarUsuario(original: Usuario | null, onGuardado: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: UsuarioFormValues) => {
      if (!original) return usuariosService.create(toCrearPayload(values));

      const cambios = toActualizarPayload(original, values);
      const nuevoRol = Number(values.roleId);
      const cambiaRol = nuevoRol !== original.rol.id;
      // Nada cambió: no hace falta llamar al backend.
      if (Object.keys(cambios).length === 0 && !cambiaRol) return null;

      // Datos y rol van por endpoints distintos: el rol solo se cambia con PATCH /users/:id/role (RF-A27).
      let guardado = original;
      if (Object.keys(cambios).length > 0) guardado = await usuariosService.update(original.id, cambios);
      if (cambiaRol) guardado = await usuariosService.cambiarRol(original.id, nuevoRol);
      return { guardado, cambiaRol };
    },
    onSuccess: async (resultado) => {
      if (resultado === null) {
        toast.info("No hay cambios que guardar.");
      } else if ("cambiaRol" in resultado && resultado.cambiaRol) {
        toast.success(`Rol actualizado a ${resultado.guardado.rol.etiqueta}.`, {
          description: "El usuario deberá iniciar sesión de nuevo para usar su nuevo rol.",
        });
      } else {
        toast.success(original ? "Usuario actualizado." : "Usuario creado.");
      }
      if (resultado !== null) await queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      onGuardado();
    },
    // Si los datos se guardaron pero el rol falló, la lista igual debe reflejar lo que sí cambió.
    onError: () => void queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY }),
  });

  return {
    ...mutation,
    /** Tipo + texto listos para mostrar en el formulario. null si no hay error. */
    errorInfo: mutation.error ? describeUsuarioError(mutation.error) : null,
  };
}

/**
 * Desactivación de una cuenta. La tabla cambia al instante (se actualiza la caché con la respuesta del
 * backend) y después se vuelve a pedir la lista para quedar sincronizada, sin recargar la página.
 */
export function useDesactivarUsuario(onDesactivado: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (usuario: Usuario) => usuariosService.desactivar(usuario.id),
    onSuccess: (actualizado) => {
      queryClient.setQueryData<UsuariosPagina>(USUARIOS_QUERY_KEY, (actual) =>
        actual && { ...actual, items: actual.items.map((u) => (u.id === actualizado.id ? actualizado : u)) }
      );
      toast.success("Usuario desactivado.");
      onDesactivado();
      void queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
    },
  });

  return {
    ...mutation,
    /** Tipo + texto listos para mostrar dentro del modal. null si no hay error. */
    errorInfo: mutation.error ? describeDesactivacionError(mutation.error) : null,
  };
}
