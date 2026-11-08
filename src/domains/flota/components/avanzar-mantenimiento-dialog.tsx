import { useState } from "react";
import { CheckCircle2, Play } from "lucide-react";

import { ConfirmActionDialog } from "@/shared/components/common/confirm-action-dialog";
import { siguienteEstado, type ErrorMantenimiento } from "../flota.mantenimiento";
import type { EstadoMantenimiento, Mantenimiento } from "../flota.types";

interface AvanzarMantenimientoDialogProps {
  /** Mantenimiento a avanzar; null cierra el diálogo. */
  mantenimiento: Mantenimiento | null;
  onCerrar: () => void;
  onConfirmar: (id: number, estado: Exclude<EstadoMantenimiento, "pending">) => Promise<ErrorMantenimiento | null>;
  avanzando?: boolean;
}

/**
 * Confirmación de «Iniciar» y «Completar» (ST-64.2). Completar cierra el mantenimiento y, si el
 * vehículo no tiene otro abierto, el back lo devuelve a disponible (escenario 2 de ES-64).
 */
export function AvanzarMantenimientoDialog({ mantenimiento, onCerrar, onConfirmar, avanzando = false }: AvanzarMantenimientoDialogProps) {
  const [error, setError] = useState<string>();
  const siguiente = mantenimiento ? siguienteEstado(mantenimiento.status) : null;
  const iniciar = siguiente === "in_progress";
  const placa = mantenimiento?.vehicle.plate ?? "";

  const cerrar = () => {
    setError(undefined);
    onCerrar();
  };

  const confirmar = async () => {
    if (!mantenimiento || !siguiente) return;
    const fallo = await onConfirmar(mantenimiento.id, siguiente);
    if (fallo) setError(fallo.mensaje);
    else cerrar();
  };

  return (
    <ConfirmActionDialog
      open={!!mantenimiento && !!siguiente}
      onOpenChange={(abierto) => { if (!abierto) cerrar(); }}
      title={iniciar ? `¿Iniciar el mantenimiento de ${placa}?` : `¿Completar el mantenimiento de ${placa}?`}
      description={iniciar
        ? "El mantenimiento pasa a «En curso». Después podrás completarlo."
        : "Se registra la fecha de cierre. Si el vehículo no tiene otro mantenimiento abierto, vuelve a estar disponible para las rutas."}
      confirmLabel={iniciar ? "Iniciar" : "Completar"}
      busyLabel={iniciar ? "Iniciando…" : "Completando…"}
      busy={avanzando}
      error={error}
      onConfirm={confirmar}
      icon={iniciar ? <Play className="size-6 stroke-[1.75]" aria-hidden /> : <CheckCircle2 className="size-6 stroke-[1.75]" aria-hidden />}
    />
  );
}
