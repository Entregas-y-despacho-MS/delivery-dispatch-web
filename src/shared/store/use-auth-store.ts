import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  /** El backend exige cambiar la contraseña antes de seguir (RF-A25). */
  requiresPwdChange?: boolean;
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
      setLogin: (user, access_token, refresh_token) =>
        set({ user, access_token, refresh_token: refresh_token ?? null }),
      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      logout: () => set({ user: null, access_token: null, refresh_token: null }),
    }),
    { name: "delivery-dispatch-web-auth" }
  )
);
