import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeUsuarioError } from "../usuarios.errors";
import type { UsuarioFormValues } from "../usuarios.schemas";
import { toActualizarPayload, toCrearPayload, usuariosService } from "../services/usuarios.service";
import type { Usuario } from "../usuarios.types";

export const USUARIOS_QUERY_KEY = ["usuarios"] as const;

/** Lista de usuarios internos. */
export function useUsuarios() {
  return useQuery({ queryKey: USUARIOS_QUERY_KEY, queryFn: usuariosService.list });
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
      // Nada cambió: no hace falta llamar al backend.
      if (Object.keys(cambios).length === 0) return null;
      return usuariosService.update(original.id, cambios);
    },
    onSuccess: async (guardado) => {
      if (guardado === null) {
        toast.info("No hay cambios que guardar.");
      } else {
        toast.success(original ? "Usuario actualizado." : "Usuario creado.");
        await queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      }
      onGuardado();
    },
  });

  return {
    ...mutation,
    /** Tipo + texto listos para mostrar en el formulario. null si no hay error. */
    errorInfo: mutation.error ? describeUsuarioError(mutation.error) : null,
  };
}
