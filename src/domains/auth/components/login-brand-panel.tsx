import { MapPin, Truck } from "lucide-react";

/** Panel de marca del login. Solo decorativo: se oculta por debajo de `lg`. */
export function LoginBrandPanel() {
  return (
    <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
      <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Truck className="h-6 w-6" aria-hidden />
        delivery-dispatch
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-semibold leading-tight">
          Cada despacho, en su lugar y a tiempo.
        </h2>
        <p className="max-w-md text-primary-foreground/80">
          Planifica rutas, controla la flota y da seguimiento a las entregas de la cadena desde un solo panel.
        </p>
      </div>

      <p className="flex items-center gap-2 text-sm text-primary-foreground/70">
        <MapPin className="h-4 w-4" aria-hidden />
        ERP corporativo · Gestión de Entregas y Despachos
      </p>
    </aside>
  );
}
