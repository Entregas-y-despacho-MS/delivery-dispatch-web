import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "../services/auth.service";
import type { ForgotPasswordInput } from "../auth.schemas";
import { parseApiError } from "@/shared/lib/api-error";

/**
 * Hook para solicitar el enlace de recuperación de contraseña (RF-A23).
 * El backend responde con 204 No Content para cualquier email válido.
 */
export function useRecuperarPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordInput) => authService.forgotPassword(data),
    onSuccess: () => {
      toast.success("Solicitud procesada correctamente", {
        description:
          "Si el correo corresponde a una cuenta activa, recibirás un enlace de restablecimiento.",
      });
    },
    onError: (error) => {
      const { message } = parseApiError(error);
      toast.error("Error al procesar la solicitud", {
        description: message || "Ocurrió un problema de comunicación con el servidor.",
      });
    },
  });
}
