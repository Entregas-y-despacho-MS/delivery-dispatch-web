import api from "@/shared/lib/axios";
import type { UsuarioFormValues } from "../usuarios.schemas";
import type {
  ActualizarUsuarioPayload,
  BackendPage,
  BackendUser,
  CrearUsuarioPayload,
  Usuario,
  UsuariosPagina,
} from "../usuarios.types";
import { toRol } from "./roles.service";

// Cada pantalla de este dominio muestra sus errores dentro de la página o del formulario,
// así que se silencia el toast global para no repetir el mismo mensaje.
const SILENCIOSO = { skipErrorToast: true } as const;

/** Adapta el usuario del backend al modelo del front. */
function toUsuario(u: BackendUser): Usuario {
  return {
    id: u.id,
    nombreCompleto: u.fullName,
    username: u.username,
    email: u.email,
    rol: toRol(u.role),
    activo: u.active,
  };
}

/** Valores del formulario → cuerpo del alta. El correo vacío se omite (el backend rechaza ""). */
export function toCrearPayload(values: UsuarioFormValues): CrearUsuarioPayload {
  const email = values.email.trim();
  return {
    fullName: values.fullName.trim(),
    username: values.username.trim(),
    ...(email && { email }),
    password: values.password,
    roleId: Number(values.roleId),
  };
}

/**
 * Valores del formulario → cuerpo de la edición, con SOLO lo que cambió respecto al usuario original.
 * Mandar el usuario o el correo sin cambios podría chocar con la validación de unicidad del backend.
 * Vaciar el correo no se soporta: el backend no acepta un correo vacío.
 */
export function toActualizarPayload(original: Usuario, values: UsuarioFormValues): ActualizarUsuarioPayload {
  const payload: ActualizarUsuarioPayload = {};
  const fullName = values.fullName.trim();
  const username = values.username.trim();
  const email = values.email.trim();
  const roleId = Number(values.roleId);

  if (fullName !== original.nombreCompleto) payload.fullName = fullName;
  if (username !== original.username) payload.username = username;
  if (email && email !== (original.email ?? "")) payload.email = email;
  if (roleId !== original.rol.id) payload.roleId = roleId;
  return payload;
}

export const usuariosService = {
  // Sin filtros ni paginación en pantalla (eso es la ES-20): se pide una página amplia.
  list: async (): Promise<UsuariosPagina> => {
    const { data } = await api.get<BackendPage<BackendUser>>("/users", {
      params: { page: 1, limit: 100 },
      ...SILENCIOSO,
    });
    return { items: data.data.map(toUsuario), total: data.meta.total };
  },

  create: async (payload: CrearUsuarioPayload): Promise<Usuario> => {
    const { data } = await api.post<BackendUser>("/users", payload, SILENCIOSO);
    return toUsuario(data);
  },

  update: async (id: number, payload: ActualizarUsuarioPayload): Promise<Usuario> => {
    const { data } = await api.put<BackendUser>(`/users/${id}`, payload, SILENCIOSO);
    return toUsuario(data);
  },
};
