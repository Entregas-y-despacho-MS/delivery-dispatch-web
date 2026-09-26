import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "../services/auth.service";
import type { ResetPasswordInput } from "../auth.schemas";
import { describeResetPasswordError, type ResetPasswordErrorInfo } from "../auth.errors";

interface UseRestablecerPasswordOptions {
  onSuccess?: () => void;
}

/**
 * Hook para enviar la nueva contraseña y el token temporal al backend (RF-A25).
 * Maneja estados de error tipificados (token vencido, clave repetida, etc.) y toasts.
 */
export function useRestablecerPassword(options?: UseRestablecerPasswordOptions) {
  const [errorInfo, setErrorInfo] = useState<ResetPasswordErrorInfo | null>(null);

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordInput) =>
      authService.resetPassword({
        token: data.token,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      setErrorInfo(null);
      toast.success("Contraseña restablecida con éxito", {
        description: "Tu clave ha sido actualizada. Ya puedes iniciar sesión.",
      });
      options?.onSuccess?.();
    },
    onError: (err) => {
      const described = describeResetPasswordError(err);
      setErrorInfo(described);
      toast.error(described.title, {
        description: described.message,
      });
    },
  });

  return {
    ...mutation,
    errorInfo,
    clearError: () => setErrorInfo(null),
  };
}
