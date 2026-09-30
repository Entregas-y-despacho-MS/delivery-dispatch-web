import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { closeSession } from "@/shared/lib/session-lifecycle";
import type { ChangePasswordInput } from "../auth.schemas";
import { authService } from "../services/auth.service";

export function useChangePassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordInput) =>
      authService.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      closeSession();
      toast.success("Contraseña actualizada. Inicia sesión con la nueva contraseña.");
      navigate("/login", { replace: true });
    },
  });
}
