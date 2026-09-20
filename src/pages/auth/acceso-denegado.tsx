import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";

export default function AccesoDenegado() {
  return (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="text-3xl font-bold">Acceso denegado</h1>
        <p className="mt-2 text-muted-foreground">Tu rol no tiene permiso para esta sección.</p>
        <Button asChild className="mt-6"><Link to="/app">Volver</Link></Button>
      </div>
    </div>
  );
}
