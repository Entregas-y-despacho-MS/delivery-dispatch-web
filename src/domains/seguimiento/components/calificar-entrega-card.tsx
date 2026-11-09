import { useRef, useState, type KeyboardEvent } from "react";
import { LoaderCircle, Star } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { formatearFechaHora } from "../seguimiento.format";
import type { SeguimientoPublico } from "../seguimiento.types";

const PUNTAJES = [1, 2, 3, 4, 5] as const;
const ETIQUETAS: Record<number, string> = { 1: "Muy mala", 2: "Mala", 3: "Regular", 4: "Buena", 5: "Excelente" };
const nombreEstrellas = (n: number) => `${n} ${n === 1 ? "estrella" : "estrellas"}`;

function Estrellas({ valor, tamano = "size-8" }: { valor: number; tamano?: string }) {
  return (
    <span className="flex gap-1" role="img" aria-label={`${nombreEstrellas(valor)} de 5`}>
      {PUNTAJES.map((n) => (
        <Star key={n} aria-hidden className={cn(tamano, n <= valor ? "fill-warning text-warning" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

interface CalificarEntregaCardProps {
  pedido: SeguimientoPublico;
  enviando?: boolean;
  error?: string | null;
  onEnviar: (score: number) => void;
}

/**
 * «Califica tu entrega» (ST-42.2, RF-U16): 5 estrellas solo cuando el back permite calificar (`canRate`).
 * Después de enviar queda el agradecimiento con las estrellas en solo lectura. Sin `canRate` ni
 * calificación no ocupa lugar. El comentario opcional lo agrega ST-43.2.
 */
export function CalificarEntregaCard({ pedido, enviando = false, error, onEnviar }: CalificarEntregaCardProps) {
  const [seleccion, setSeleccion] = useState(0);
  const [resaltado, setResaltado] = useState(0);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  if (pedido.rating) {
    return (
      <section className="space-y-2 rounded-xl border bg-card p-5 shadow-sm" aria-label="Tu calificación">
        <h2 className="text-lg font-semibold">¡Gracias por calificar tu entrega!</h2>
        <Estrellas valor={pedido.rating.score} />
        <p className="text-sm text-muted-foreground">
          {ETIQUETAS[pedido.rating.score]} · Calificada el {formatearFechaHora(pedido.rating.createdAt)}
        </p>
      </section>
    );
  }
  if (!pedido.canRate) return null;

  const visible = resaltado || seleccion;
  const elegir = (n: number) => {
    setSeleccion(n);
    botones.current[n - 1]?.focus();
  };
  // Grupo de radio: las flechas cambian la estrella elegida, Inicio y Fin van a los extremos.
  const alTeclear = (evento: KeyboardEvent<HTMLDivElement>) => {
    const actual = seleccion || 0;
    const siguiente: Record<string, number> = {
      ArrowRight: Math.min(5, actual + 1),
      ArrowUp: Math.min(5, actual + 1),
      ArrowLeft: Math.max(1, actual - 1),
      ArrowDown: Math.max(1, actual - 1),
      Home: 1,
      End: 5,
    };
    if (!(evento.key in siguiente)) return;
    evento.preventDefault();
    elegir(siguiente[evento.key]);
  };

  return (
    <section className="space-y-4 rounded-xl border border-brand-turquoise/40 bg-card p-5 shadow-sm" aria-label="Califica tu entrega">
      <div>
        <h2 className="text-lg font-semibold">Califica tu entrega</h2>
        <p className="text-sm text-muted-foreground">Tu opinión nos ayuda a mejorar. Solo puedes calificar una vez.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Calificación de la entrega" className="flex gap-1" onKeyDown={alTeclear}
          onMouseLeave={() => setResaltado(0)}>
          {PUNTAJES.map((n) => (
            <button
              key={n}
              ref={(boton) => { botones.current[n - 1] = boton; }}
              type="button"
              role="radio"
              aria-checked={seleccion === n}
              aria-label={nombreEstrellas(n)}
              // Solo una estrella entra en el orden de tabulación: la elegida, o la primera si no hay.
              tabIndex={(seleccion || 1) === n ? 0 : -1}
              disabled={enviando}
              onClick={() => elegir(n)}
              onMouseEnter={() => setResaltado(n)}
              className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 motion-reduce:transition-none"
            >
              <Star aria-hidden className={cn("size-9", n <= visible ? "fill-warning text-warning" : "text-muted-foreground/50")} />
            </button>
          ))}
        </div>
        <span className="min-w-20 text-sm font-medium" aria-live="polite">{visible ? ETIQUETAS[visible] : ""}</span>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="button" disabled={!seleccion || enviando} onClick={() => onEnviar(seleccion)} className="w-full sm:w-auto">
        {enviando && <LoaderCircle className="animate-spin" aria-hidden />}
        {enviando ? "Enviando…" : "Enviar calificación"}
      </Button>
    </section>
  );
}
