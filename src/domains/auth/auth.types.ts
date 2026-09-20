import type { AuthUser } from "@/shared/store/use-auth-store";

export interface LoginResponse {
  user: AuthUser;
  access_token: string;
}
