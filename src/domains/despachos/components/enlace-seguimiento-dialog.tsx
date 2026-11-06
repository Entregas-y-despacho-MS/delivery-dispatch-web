import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";

interface EnlaceSeguimientoDialogProps {
  /** Enlace que el navegador no dejó copiar solo; null = cerrado. */
  enlace: { codigo: string; url: string } | null;
  onCerrar: () => void;
}

/** Solo si el portapapeles falla: muestra el enlace una vez para copiarlo a mano; al cerrar se olvida. */
export function EnlaceSeguimientoDialog({ enlace, onCerrar }: EnlaceSeguimientoDialogProps) {
  return (
    <Dialog open={enlace !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enlace de {enlace?.codigo}</DialogTitle>
          <DialogDescription>
            No pudimos copiarlo solo. Cópialo y compártelo únicamente con el cliente: con este enlace puede ver y cambiar su entrega.
          </DialogDescription>
        </DialogHeader>
        <Input readOnly value={enlace?.url ?? ""} aria-label="Enlace de seguimiento" onFocus={(e) => e.currentTarget.select()} autoFocus />
        <DialogFooter>
          <Button type="button" onClick={onCerrar}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
