import { useState } from "react";
import { Ban } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { LIMITE_CAUSAL } from "../excluidos-cotejo.reglas";

interface CancelarDespachoDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  /** Código o referencia que ve el coordinador, p. ej. DSP-2026-00045. */
  codigo: string;
  enviando: boolean;
  /** Mensaje del último 400/409 del back. */
  error: string | null;
  onConfirmar: (causal: string) => void;
}

/** Confirmación de cancelar un despacho con causal obligatoria (ST-241.4). No se puede deshacer. */
export function CancelarDespachoDialog({ abierto, onOpenChange, enviando, ...resto }: CancelarDespachoDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => !enviando && onOpenChange(valor)}>
      <DialogContent className="sm:max-w-lg">
        {abierto && <Contenido {...resto} enviando={enviando} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ codigo, enviando, error, onConfirmar, onCerrar }: Omit<CancelarDespachoDialogProps, "abierto" | "onOpenChange"> & { onCerrar: () => void }) {
  const [causal, setCausal] = useState("");
  const texto = causal.trim();

  return (
    <form
      aria-label="Cancelar despacho"
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (texto) onConfirmar(texto);
      }}
    >
      <DialogHeader>
        <DialogTitle>{`Cancelar ${codigo}`}</DialogTitle>
        <DialogDescription>
          El despacho pasa a «Cancelado» y no se puede deshacer. Si estaba en un lote en planificación, sale del lote y libera su capacidad.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="causal-cancelacion">Causal de la cancelación</Label>
        <Textarea
          id="causal-cancelacion"
          value={causal}
          onChange={(e) => setCausal(e.target.value)}
          maxLength={LIMITE_CAUSAL}
          placeholder="Por ejemplo: el bulto no apareció en el cotejo y el cliente confirmó la pérdida."
          required
          disabled={enviando}
          aria-describedby="causal-ayuda"
        />
        <p id="causal-ayuda" className="text-xs text-muted-foreground">
          Obligatoria. Queda en la auditoría del despacho. {causal.length}/{LIMITE_CAUSAL}
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={enviando}>Volver</Button>
        <Button type="submit" variant="destructive" disabled={enviando || !texto}>
          <Ban aria-hidden /> {enviando ? "Cancelando…" : "Cancelar despacho"}
        </Button>
      </DialogFooter>
    </form>
  );
}
