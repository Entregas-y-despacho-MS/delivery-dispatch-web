import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { hasRole, ROLES_WEB } from "@/config/roles";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { authService } from "../services/auth.service";
import { describeLoginError, WebAccessDeniedError } from "../auth.errors";
import type { LoginInput } from "../auth.schemas";

/**
 * A dónde ir tras entrar: la ruta que se intentó abrir sin sesión (ProtectedRoute la deja
 * en location.state.from) o, si no hay, el panel.
 */
export function useLoginDestination() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return from?.startsWith("/app") ? from : "/app";
}

/** La pantalla solo llama a este hook: no sabe nada de axios ni del store. */
export function useLogin() {
  const setLogin = useAuthStore((s) => s.setLogin);
  const navigate = useNavigate();
  const destination = useLoginDestination();
  // Se activa cuando el backend pide el código de dos pasos y se mantiene hasta entrar.
  const [needsTotp, setNeedsTotp] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const session = await authService.login(values);

      // El repartidor (y cualquier rol sin pantallas web) no debe quedar con sesión abierta aquí.
      if (!hasRole(session.user.rol.id, ROLES_WEB)) {
        await authService.logout(session.accessToken).catch(() => { /* igual se rechaza el acceso */ });
        throw new WebAccessDeniedError();
      }
      return session;
    },
    onSuccess: ({ user, accessToken, refreshToken }) => {
      setLogin(user, accessToken, refreshToken);
      toast.success(`Bienvenido, ${user.nombres}`);
      // TODO ST-17.2: llevar a la vista de cambio obligatorio de contraseña cuando exista.
      if (user.requiresPwdChange) toast.warning("Debes cambiar tu contraseña antes de continuar.");
      navigate(destination, { replace: true });
    },
    onError: (error) => {
      const { kind } = describeLoginError(error);
      if (kind === "totp-required" || kind === "totp-invalid") setNeedsTotp(true);
    },
  });

  return {
    ...mutation,
    needsTotp,
    /** Tipo + texto listos para mostrar en el formulario. null si no hay error. */
    errorInfo: mutation.error ? describeLoginError(mutation.error) : null,
  };
}
