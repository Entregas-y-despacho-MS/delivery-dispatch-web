import { CalendarClock, CheckCircle2, Info, MessageSquareText } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { avisoAutoservicio } from "../seguimiento.format";
import type { Autoservicio } from "../seguimiento.types";

interface AccionesAutoservicioProps {
  autoservicio: Autoservicio;
  confirmando: boolean;
  /** Mensaje del último intento fallido de confirmar. */
  error: string | null;
  onConfirmar: () => void;
  onReprogramar: () => void;
  onSolicitarCambio: () => void;
}

/**
 * Lo que el cliente puede hacer según su ventana (escenarios 2 y 4): confirmar, elegir otro horario
 * o, cuando la ventana venció o se acabaron los intentos, solo solicitar un cambio.
 */
export function AccionesAutoservicio({ autoservicio, confirmando, error, onConfirmar, onReprogramar, onSolicitarCambio }: AccionesAutoservicioProps) {
  const aviso = avisoAutoservicio(autoservicio);
  const hayAcciones = autoservicio.canConfirm || autoservicio.canReschedule || autoservicio.canRequestChange;

  return (
    <section className="space-y-3 rounded-xl border bg-card p-5 shadow-sm" aria-label="¿Qué quieres hacer?">
      {aviso && (
        <p className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> {aviso}
        </p>
      )}
      {autoservicio.open && autoservicio.canReschedule && (
        <p className="text-sm text-muted-foreground">
          {`Te ${autoservicio.rescheduleAttemptsLeft === 1 ? "queda 1 cambio" : `quedan ${autoservicio.rescheduleAttemptsLeft} cambios`} de horario.`}
        </p>
      )}

      {hayAcciones && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {autoservicio.canConfirm && (
            <Button type="button" onClick={onConfirmar} disabled={confirmando}>
              <CheckCircle2 aria-hidden /> {confirmando ? "Confirmando..." : "Confirmar entrega"}
            </Button>
          )}
          {autoservicio.canReschedule && (
            <Button type="button" variant="outline" onClick={onReprogramar} disabled={confirmando}>
              <CalendarClock aria-hidden /> Elegir otro horario
            </Button>
          )}
          {autoservicio.canRequestChange && (
            <Button type="button" variant={autoservicio.open ? "ghost" : "outline"} onClick={onSolicitarCambio} disabled={confirmando}>
              <MessageSquareText aria-hidden /> Solicitar un cambio
            </Button>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
