import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="text-5xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Esta página no existe.</p>
        <Button asChild className="mt-6"><Link to="/">Volver al inicio</Link></Button>
      </div>
    </div>
  );
}
