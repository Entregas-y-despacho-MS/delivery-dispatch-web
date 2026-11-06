import { Link } from "react-router-dom";
import { portalHomeHref } from "@/config/portal-routes";
import { useAuthStore } from "@/shared/store/use-auth-store";
import { Button } from "@/shared/components/ui/button";

export default function AccesoDenegado() {
  const roleId = useAuthStore((state) => state.user?.rol.id);
  const homeHref = roleId === undefined ? "/login" : portalHomeHref(roleId);

  return (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="text-3xl font-bold">Acceso denegado</h1>
        <p className="mt-2 text-muted-foreground">Tu rol no tiene permiso para esta sección.</p>
        <Button asChild className="mt-6"><Link to={homeHref}>Volver al inicio</Link></Button>
      </div>
    </div>
  );
}
