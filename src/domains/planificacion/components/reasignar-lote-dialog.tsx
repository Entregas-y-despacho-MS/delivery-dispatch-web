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
import { Textarea } from "@/shared/components/ui/textarea";
import type { ReasignarRevisorPayload } from "../planificacion.types";

/** Largo máximo del motivo que acepta el back. */
const MAX_MOTIVO_REASIGNACION = 500;

/** Coordinador o supervisor activo; la página lo arma con los datos de usuarios. */
export interface OpcionRevisor {
  id: number;
  nombre: string;
  /** «Coordinador» o «Supervisor». */
  rol: string;
}

export interface Reasignacion {
  payload: ReasignarRevisorPayload;
  nombre: string;
}

interface ReasignarLoteDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  revisorActualId: number | null;
  opciones: OpcionRevisor[];
  guardando: boolean;
  onConfirmar: (reasignacion: Reasignacion) => void;
}

/** Entrega el lote completo a otro coordinador o supervisor (ST-215.1). El motivo queda en la bitácora. */
export function ReasignarLoteDialog({ abierto, onOpenChange, ...resto }: ReasignarLoteDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => !resto.guardando && onOpenChange(valor)}>
      <DialogContent className="sm:max-w-md">
        {abierto && <Contenido {...resto} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  revisorActualId,
  opciones,
  guardando,
  onConfirmar,
  onCerrar,
}: Omit<ReasignarLoteDialogProps, "abierto" | "onOpenChange"> & { onCerrar: () => void }) {
  const [elegido, setElegido] = useState("");
  const [motivo, setMotivo] = useState("");
  // El revisor actual no aparece: reasignarse a sí mismo no cambia nada.
  const disponibles = opciones.filter((opcion) => opcion.id !== revisorActualId);
  const revisor = disponibles.find((opcion) => String(opcion.id) === elegido);
  const motivoLimpio = motivo.trim();

  const confirmar = () => {
    if (!revisor) return;
    onConfirmar({
      nombre: revisor.nombre,
      payload: { reviewerUserId: revisor.id, ...(motivoLimpio ? { reason: motivoLimpio } : {}) },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reasignar lote</DialogTitle>
        <DialogDescription>El lote completo pasa a otra persona, que será la única que pueda aprobarlo.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="revisor-lote">Nuevo revisor</Label>
          <Select value={elegido} onValueChange={setElegido} disabled={guardando || disponibles.length === 0}>
            <SelectTrigger id="revisor-lote" className="w-full">
              <SelectValue placeholder={disponibles.length === 0 ? "No hay otros coordinadores activos" : "Elige a quién pasarlo"} />
            </SelectTrigger>
            <SelectContent>
              {disponibles.map((opcion) => (
                <SelectItem key={opcion.id} value={String(opcion.id)}>{opcion.nombre} · {opcion.rol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivo-reasignacion">Motivo (opcional)</Label>
          <Textarea
            id="motivo-reasignacion"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            maxLength={MAX_MOTIVO_REASIGNACION}
            placeholder="Ej.: estoy de licencia hasta el lunes."
            disabled={guardando}
            rows={3}
          />
          <p className="text-right text-xs text-muted-foreground">{motivo.length}/{MAX_MOTIVO_REASIGNACION}</p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="button" onClick={confirmar} disabled={guardando || !revisor}>
          {guardando ? "Reasignando..." : "Reasignar lote"}
        </Button>
      </DialogFooter>
    </>
  );
}
