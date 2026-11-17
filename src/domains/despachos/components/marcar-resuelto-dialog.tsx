import { useState } from "react";
import { PackageCheck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { FormDialogContent, FormDialogFooter } from "@/shared/components/common/form-dialog";
import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { LIMITE_CAUSAL } from "../excluidos-cotejo.reglas";

interface MarcarResueltoDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  codigo: string;
  enviando: boolean;
  error: string | null;
  onConfirmar: (nota: string | null) => void;
}

/** «El bulto apareció»: confirma la resolución del cotejo con una nota opcional. */
export function MarcarResueltoDialog({ abierto, onOpenChange, enviando, ...resto }: MarcarResueltoDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => !enviando && onOpenChange(valor)}>
      <FormDialogContent className="sm:max-w-2xl">
        {abierto && <Contenido {...resto} enviando={enviando} onCerrar={() => onOpenChange(false)} />}
      </FormDialogContent>
    </Dialog>
  );
}

function Contenido({ codigo, enviando, error, onConfirmar, onCerrar }: Omit<MarcarResueltoDialogProps, "abierto" | "onOpenChange"> & { onCerrar: () => void }) {
  const [nota, setNota] = useState("");
  return (
    <form
      aria-label="Marcar cotejo resuelto"
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        onConfirmar(nota.trim() || null);
      }}
    >
      <FormDialogHeader
        icon={PackageCheck}
        title={`Marcar ${codigo} como resuelto`}
        description="Úsalo cuando el bulto apareció. La parada sale de esta lista y sigue asignada a su ruta; después decides si sale, se reprograma o se cancela."
      />
      <div className="space-y-1.5">
        <Label htmlFor="nota-cotejo">Nota (opcional)</Label>
        <Textarea id="nota-cotejo" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={LIMITE_CAUSAL}
          placeholder="Por ejemplo: el bulto estaba en otra estantería." disabled={enviando} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <FormDialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={enviando}>Volver</Button>
        <Button type="submit" disabled={enviando}>
          <PackageCheck aria-hidden /> {enviando ? "Guardando…" : "Marcar resuelto"}
        </Button>
      </FormDialogFooter>
    </form>
  );
}
