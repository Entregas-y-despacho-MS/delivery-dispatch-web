import { useEffect, useState } from "react";
import { AlarmClock, CircleAlert, Clock, Siren } from "lucide-react";
import { cn } from "cn";

import { describirRelojRevision, type EstadoReloj } from "../planificacion.reloj";

/** Hora actual que se renueva cada minuto, para que el reloj no quede congelado. */
function useAhora(intervaloMs = 60_000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return ahora;
}

const ESTILO: Record<EstadoReloj, { clase: string; Icono: typeof Clock }> = {
  "sin-configurar": { clase: "border-border bg-muted text-muted-foreground", Icono: CircleAlert },
  "en-plazo": { clase: "border-border bg-muted text-foreground", Icono: Clock },
  proximo: { clase: "border-warning/30 bg-warning/10 text-warning", Icono: AlarmClock },
  vencido: { clase: "border-destructive/30 bg-destructive/10 text-destructive", Icono: AlarmClock },
  escalado: { clase: "border-destructive/40 bg-destructive/15 text-destructive", Icono: Siren },
};

interface RelojRevisionLoteProps {
  /** `shift_date` del lote (AAAA-MM-DD). */
  fechaTurno: string;
  /** Parámetro `final_review_end_time`; la página lo lee de /settings. */
  finRevision: string;
  /** Parámetro `final_review_escalation_time`. */
  escalamiento: string;
  /** Solo para pruebas: hora fija en vez del reloj real. */
  ahora?: number;
}

/** Reloj de revisión del lote definitivo (ST-51.1): cuánto falta, si venció o si ya escaló a incidencia. */
export function RelojRevisionLote({ ahora, ...datos }: RelojRevisionLoteProps) {
  const ahoraReal = useAhora();
  const reloj = describirRelojRevision(datos, ahora ?? ahoraReal);
  const { clase, Icono } = ESTILO[reloj.estado];

  return (
    <p className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-sm", clase)} role="status">
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{reloj.texto}</span>
    </p>
  );
}
