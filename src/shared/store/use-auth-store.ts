import { create } from "zustand";
import { persist } from "zustand/middleware";

// Ajusta esta interfaz a lo que devuelva TU backend en el login.
export interface AuthUser {
  id: string;
  nombres: string;
  apellidos: string;
  email?: string;
  avatar_url?: string | null;
  rol: { id: number; nombre: string };
}

interface AuthState {
  user: AuthUser | null;
  access_token: string | null;
  setLogin: (user: AuthUser, token: string) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      setLogin: (user, access_token) => set({ user, access_token }),
      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      logout: () => set({ user: null, access_token: null }),
    }),
    { name: "delivery-dispatch-web-auth" }
  )
);
