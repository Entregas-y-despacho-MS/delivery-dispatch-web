import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

/** Repartidor activo que se puede proponer; la página lo arma con los datos de usuarios. */
export interface OpcionConductor {
  id: number;
  nombre: string;
}

interface CambiarConductorDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  conductorActualId: number | null;
  opciones: OpcionConductor[];
  guardando: boolean;
  onConfirmar: (conductor: OpcionConductor) => void;
}

/**
 * Corrección del conductor propuesto (ST-51.1). El back revisa que esté activo y libre ese día;
 * en la revisión final vuelve a validar el lote, que puede regresar a provisional.
 */
export function CambiarConductorDialog({ abierto, onOpenChange, ...resto }: CambiarConductorDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => !resto.guardando && onOpenChange(valor)}>
      <DialogContent className="sm:max-w-md">
        {abierto && <Contenido {...resto} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  conductorActualId,
  opciones,
  guardando,
  onConfirmar,
  onCerrar,
}: Omit<CambiarConductorDialogProps, "abierto" | "onOpenChange"> & { onCerrar: () => void }) {
  const [elegido, setElegido] = useState(conductorActualId ? String(conductorActualId) : "");
  const conductor = opciones.find((opcion) => String(opcion.id) === elegido);
  const sinCambios = !conductor || conductor.id === conductorActualId;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cambiar conductor del lote</DialogTitle>
        <DialogDescription>Al guardar, el sistema vuelve a validar el lote. Si no pasa, regresa a provisional.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="conductor-lote">Conductor propuesto</Label>
        <Select value={elegido} onValueChange={setElegido} disabled={guardando || opciones.length === 0}>
          <SelectTrigger id="conductor-lote" className="w-full">
            <SelectValue placeholder={opciones.length === 0 ? "No hay repartidores activos" : "Elige un repartidor"} />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((opcion) => (
              <SelectItem key={opcion.id} value={String(opcion.id)}>{opcion.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => conductor && onConfirmar(conductor)} disabled={guardando || sinCambios}>
          {guardando ? "Validando..." : "Cambiar conductor"}
        </Button>
      </DialogFooter>
    </>
  );
}
