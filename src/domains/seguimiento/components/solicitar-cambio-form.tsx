import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

/** Límite del back (`detail`, 500 caracteres). */
export const MAX_DETALLE_CAMBIO = 500;

interface SolicitarCambioFormProps {
  enviando: boolean;
  error: string | null;
  onEnviar: (detalle: string) => void;
  onCancelar: () => void;
}

/** Solicitud de cambio (escenario 4): queda registrada y la decide el coordinador; nada cambia solo. */
export function SolicitarCambioForm({ enviando, error, onEnviar, onCancelar }: SolicitarCambioFormProps) {
  const [detalle, setDetalle] = useState("");
  const texto = detalle.trim();

  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-5 shadow-sm"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (texto) onEnviar(texto);
      }}
    >
      <div className="space-y-1">
        <h2 className="font-semibold">Solicitar un cambio</h2>
        <p className="text-sm text-muted-foreground">Cuéntanos qué necesitas. Despacho lo revisará y se comunicará contigo.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="detalle-cambio">¿Qué necesitas?</Label>
        <Textarea
          id="detalle-cambio"
          value={detalle}
          maxLength={MAX_DETALLE_CAMBIO}
          rows={4}
          placeholder="Por ejemplo: esa semana estaré de viaje, necesito la entrega después del 28."
          onChange={(evento) => setDetalle(evento.target.value)}
          disabled={enviando}
        />
        <p className="text-right text-xs text-muted-foreground">{`${detalle.length}/${MAX_DETALLE_CAMBIO}`}</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={enviando}>Volver</Button>
        <Button type="submit" disabled={enviando || !texto}>{enviando ? "Enviando..." : "Enviar solicitud"}</Button>
      </div>
    </form>
  );
}
