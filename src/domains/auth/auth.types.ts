import type { AuthUser } from "@/shared/store/use-auth-store";

/** UserDto del backend (delivery-dispatch-svc → modules/users/dto/user.dto.ts). */
export interface BackendUser {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  role: { id: number; name: string };
  active: boolean;
  twoFactorEnabled: boolean;
  requiresPwdChange: boolean;
  createdAt: string;
}

/** Respuesta real de POST /auth/login (AuthResponseDto). */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
}

/** Lo que el front conserva tras iniciar sesión, ya adaptado a su propio modelo. */
export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
