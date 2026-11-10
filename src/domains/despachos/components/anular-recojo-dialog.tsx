import { useState } from "react";
import { Ban, LoaderCircle, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { MAX_MOTIVO_ANULACION, type ErrorRecojo } from "../recojos.reglas";
import type { Recojo } from "../types/recojos.types";

interface AnularRecojoDialogProps {
  /** Recojo a anular; null cierra el diálogo. */
  recojo: Recojo | null;
  onCerrar: () => void;
  onConfirmar: (id: number, motivo: string) => Promise<ErrorRecojo | null>;
  anulando?: boolean;
}

/**
 * «Anular recojo» (ST-81.1, PATCH de ST-81.2): solo el coordinador y antes de que salga la ruta. El
 * motivo es obligatorio (hasta 500 caracteres) y queda en la auditoría del despacho.
 */
export function AnularRecojoDialog({ recojo, onCerrar, onConfirmar, anulando = false }: AnularRecojoDialogProps) {
  const [motivo, setMotivo] = useState("");
  const [intentoVacio, setIntentoVacio] = useState(false);
  const [error, setError] = useState<string>();

  const cerrar = () => {
    if (anulando) return;
    setMotivo("");
    setIntentoVacio(false);
    setError(undefined);
    onCerrar();
  };

  const confirmar = async () => {
    if (!recojo) return;
    if (!motivo.trim()) {
      setIntentoVacio(true);
      return;
    }
    setError(undefined);
    const fallo = await onConfirmar(recojo.id, motivo);
    if (fallo) setError(fallo.mensaje);
    else {
      setMotivo("");
      setIntentoVacio(false);
      onCerrar();
    }
  };

  const faltaMotivo = intentoVacio && !motivo.trim();
  const codigo = recojo?.trackingCode ?? recojo?.sourceOrderRef ?? "";

  return (
    <Dialog open={!!recojo} onOpenChange={(abierto) => { if (!abierto) cerrar(); }}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive">
            <Ban className="size-6 stroke-[1.75]" aria-hidden />
          </div>
          <DialogHeader className="gap-1.5 text-left">
            <DialogTitle>¿Anular el recojo {codigo}?</DialogTitle>
            <DialogDescription>
              El recojo queda cancelado y sale de la planificación. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="anular-motivo">Motivo</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{motivo.length}/{MAX_MOTIVO_ANULACION}</span>
            </div>
            <Textarea
              id="anular-motivo"
              className="min-h-24"
              maxLength={MAX_MOTIVO_ANULACION}
              value={motivo}
              disabled={anulando}
              placeholder="Ej.: el cliente retiró la solicitud de devolución"
              aria-invalid={faltaMotivo}
              aria-describedby={faltaMotivo ? "anular-motivo-error" : undefined}
              onChange={(evento) => setMotivo(evento.target.value)}
            />
            {faltaMotivo && (
              <p id="anular-motivo-error" role="alert" className="text-sm text-destructive">Escribe por qué se anula el recojo.</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={anulando} onClick={cerrar}>Volver</Button>
            <Button type="button" variant="destructive" disabled={anulando} onClick={() => void confirmar()}>
              {anulando ? <LoaderCircle className="animate-spin" aria-hidden /> : <Ban aria-hidden />}
              {anulando ? "Anulando…" : "Anular recojo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
