import { Link2Off, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import type { VistaError } from "../seguimiento.errores";

interface SeguimientoErrorProps {
  vista: VistaError;
  onReintentar: () => void;
  reintentando: boolean;
}

const CONTENIDO: Record<VistaError, { titulo: string; texto: string; Icono: typeof Link2Off }> = {
  "enlace-invalido": {
    titulo: "Este enlace no es válido o ya venció",
    texto: "Revisa que hayas abierto el enlace completo del correo. Si el problema sigue, comunícate con Despacho.",
    Icono: Link2Off,
  },
  "demasiados-intentos": {
    titulo: "Demasiados intentos",
    texto: "Por seguridad bloqueamos el acceso por unos minutos. Espera un momento y vuelve a intentar.",
    Icono: ShieldAlert,
  },
  error: {
    titulo: "No pudimos cargar tu pedido",
    texto: "Hubo un problema de conexión o del servidor. Intenta de nuevo.",
    Icono: TriangleAlert,
  },
};

/** Estados en los que no hay pedido que mostrar. Un enlace inválido no ofrece reintentar: no cambiaría nada. */
export function SeguimientoError({ vista, onReintentar, reintentando }: SeguimientoErrorProps) {
  const { titulo, texto, Icono } = CONTENIDO[vista];
  return (
    <section role="alert" className="flex flex-col items-center gap-3 rounded-xl border bg-card px-5 py-10 text-center shadow-sm">
      <Icono className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold">{titulo}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{texto}</p>
      {vista !== "enlace-invalido" && (
        <Button type="button" variant="outline" onClick={onReintentar} disabled={reintentando}>
          <RefreshCw className={reintentando ? "animate-spin" : undefined} aria-hidden /> Reintentar
        </Button>
      )}
    </section>
  );
}
