import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { authService } from "../services/auth.service";
import type { LoginInput } from "../auth.schemas";

/** La pantalla solo llama a este hook: no sabe nada de axios ni del store. */
export function useLogin() {
  const setLogin = useAuthStore((s) => s.setLogin);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (values: LoginInput) => authService.login(values),
    onSuccess: ({ user, access_token }) => {
      setLogin(user, access_token);
      toast.success(`Bienvenido, ${user.nombres}`);
      navigate("/app", { replace: true });
    },
  });
}
