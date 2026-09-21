import { MapPin, Navigation, PackageSearch, Route, Truck } from "lucide-react";

/**
 * Panel de marca del login. Se oculta por debajo de `lg`.
 * Superficie neutra con el naranja reservado al acento: no cubre áreas grandes.
 */
const CAPACIDADES = [
  {
    icon: Route,
    titulo: "Planificación de rutas",
    detalle: "Agrupa los despachos por zona y arma la ruta del día.",
  },
  {
    icon: Navigation,
    titulo: "Control de flota",
    detalle: "Ubicación de los vehículos y estado de cada repartidor.",
  },
  {
    icon: PackageSearch,
    titulo: "Seguimiento de entregas",
    detalle: "Estado, evidencia e incidencias de punta a punta.",
  },
];

export function LoginBrandPanel() {
  return (
    <aside className="hidden flex-col justify-between border-r bg-muted p-10 lg:flex xl:p-12">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck className="size-5" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight">Delivery Dispatch</span>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Cada despacho, en su lugar y a tiempo.
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Planifica rutas, controla la flota y da seguimiento a las entregas de la cadena desde un
            solo panel.
          </p>
        </div>

        <ul className="space-y-5">
          {CAPACIDADES.map(({ icon: Icon, titulo, detalle }) => (
            <li key={titulo} className="flex max-w-md gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{titulo}</p>
                <p className="text-sm text-muted-foreground">{detalle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        ERP corporativo · Gestión de Entregas y Despachos
      </p>
    </aside>
  );
}
