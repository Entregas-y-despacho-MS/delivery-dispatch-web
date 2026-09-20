import api from "@/shared/lib/axios";
import type { AuthUser } from "@/shared/store/use-auth-store";
import { ROLE_BY_BACKEND_NAME, ROLE_LABELS } from "@/config/roles";
import type { LoginInput } from "../auth.schemas";
import type { BackendUser, LoginResponse, Session } from "../auth.types";
import { UnknownRoleError } from "../auth.errors";

/** Adapta el usuario del backend al modelo del front. Es el único lugar que conoce ambos. */
function toAuthUser(u: BackendUser): AuthUser {
  const roleId = ROLE_BY_BACKEND_NAME[u.role.name];
  if (roleId === undefined) throw new UnknownRoleError(u.role.name);

  // El backend entrega un solo campo fullName; el layout usa nombres/apellidos.
  const [nombres = "", ...resto] = u.fullName.trim().split(/\s+/);

  return {
    id: String(u.id),
    username: u.username,
    nombres,
    apellidos: resto.join(" "),
    email: u.email ?? undefined,
    rol: { id: roleId, nombre: ROLE_LABELS[roleId] },
    requiresPwdChange: u.requiresPwdChange,
  };
}

export const authService = {
  login: async ({ username, password, totpCode }: LoginInput): Promise<Session> => {
    // El backend rechaza campos desconocidos y un totpCode vacío: solo se manda si tiene valor.
    const { data } = await api.post<LoginResponse>("/auth/login", {
      username,
      password,
      totpCode: totpCode || undefined,
    });
    return {
      user: toAuthUser(data.user),
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  /**
   * `accessToken` es opcional: solo hace falta cuando todavía no hay sesión guardada
   * (ej. se cierra la sesión recién abierta de una cuenta sin acceso a la web).
   */
  logout: async (accessToken?: string): Promise<void> => {
    await api.post(
      "/auth/logout",
      undefined,
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
    );
  },
};
