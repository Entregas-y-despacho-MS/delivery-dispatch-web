import { useEffect, useState } from "react";
import { AlarmClock, Clock } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { describirVencimientoSla } from "../despachos.format";

/** Hora actual que se renueva cada minuto, para que «Vence en…» no quede congelado. */
function useAhora(intervaloMs = 60_000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return ahora;
}

/**
 * Vencimiento del SLA de un pedido (ST-58.1): rojo si ya venció, ámbar si vence en menos de 2 h
 * y texto gris si va a tiempo. Al pasar el mouse se ve la fecha y hora exactas (hora de Bolivia).
 */
export function VencimientoSla({ slaDueAt }: { slaDueAt: string | null }) {
  const ahora = useAhora();
  const { estado, texto, fecha } = describirVencimientoSla(slaDueAt, ahora);
  const detalle = fecha ? `Vence el ${fecha}` : undefined;

  if (estado === "vencido") {
    return (
      <Badge variant="outline" title={detalle} className="whitespace-nowrap border-destructive/20 bg-destructive/10 text-destructive">
        <AlarmClock aria-hidden /> {texto}
      </Badge>
    );
  }
  if (estado === "proximo") {
    return (
      <Badge variant="outline" title={detalle} className="whitespace-nowrap border-warning/20 bg-warning/10 text-warning">
        <Clock aria-hidden /> {texto}
      </Badge>
    );
  }
  return <span title={detalle} className="whitespace-nowrap text-muted-foreground">{texto}</span>;
}
