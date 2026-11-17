import { create } from "zustand";
import { persist } from "zustand/middleware";

// No se persiste: tras recargar la página ya no quedan peticiones de la sesión anterior.
let sessionGeneration = 0;
export function getSessionGeneration() {
  return sessionGeneration;
}

// Forma con la que el front guarda al usuario. El adaptador que la construye a partir
// de la respuesta del backend vive en domains/auth/services/auth.service.ts.
export interface AuthUser {
  id: string;
  username?: string;
  nombres: string;
  apellidos: string;
  email?: string;
  avatar_url?: string | null;
  /** id = id INTERNO del front (ver config/roles.ts), no el de la base de datos. */
  rol: { id: number; nombre: string };
  /** Señal de login/refresh: el backend exige cambiar la contraseña antes de seguir. */
  mustChangePassword?: boolean;
  /** Campo de sesiones persistidas por versiones anteriores del frontend. */
  requiresPwdChange?: boolean;
}

export function needsPasswordChange(user: AuthUser | null): boolean {
  return Boolean(user?.mustChangePassword || user?.requiresPwdChange);
}

interface AuthState {
  user: AuthUser | null;
  access_token: string | null;
  /** Solo se usa en POST /auth/refresh (renovación silenciosa, ST-16.3). */
  refresh_token: string | null;
  setLogin: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      setLogin: (user, access_token, refresh_token) => {
        sessionGeneration += 1;
        set({ user, access_token, refresh_token: refresh_token ?? null });
      },
      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      logout: () => {
        sessionGeneration += 1;
        set({ user: null, access_token: null, refresh_token: null });
      },
    }),
    { name: "delivery-dispatch-web-auth" }
  )
);
