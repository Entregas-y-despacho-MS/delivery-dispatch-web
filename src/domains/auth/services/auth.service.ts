import api from "@/shared/lib/axios";
import type { LoginInput } from "../auth.schemas";
import type { LoginResponse } from "../auth.types";

export const authService = {
  login: async (payload: LoginInput): Promise<LoginResponse> =>
    (await api.post<LoginResponse>("/auth/login", payload)).data,

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
