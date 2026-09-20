import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { authService } from "../services/auth.service";

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return () => {
    authService.logout().catch(() => { /* si falla, igual limpiamos local */ });
    logout();
    toast.info("Sesión cerrada correctamente");
    navigate("/login", { replace: true });
  };
}
