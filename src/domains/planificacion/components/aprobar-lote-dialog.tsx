import { Ban, Truck, UserRound } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { calcularCapacidad, puedeAprobarPorCapacidad, type CargaVehiculo } from "../planificacion.capacidad";
import { BarraCapacidad } from "./capacidad-vehiculo";

interface AprobarLoteDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  /** Nombre del lote para el título, p. ej. «Lote #12». */
  titulo: string;
  /** Conductor propuesto; null si el lote aún no tiene. */
  conductor: string | null;
  /** Vehículo asignado (placa o nombre); null si aún no tiene. */
  vehiculo: string | null;
  cantidadPedidos: number;
  /** Total de los pedidos frente a la capacidad del vehículo, en kg. */
  peso: CargaVehiculo;
  /** Total de los pedidos frente a la capacidad del vehículo, en m³. */
  volumen: CargaVehiculo;
  aprobando: boolean;
  onConfirmar: () => void;
}

/**
 * Confirmación de la 2.ª aprobación (ST-51.1): confirma juntos lote, pedidos, vehículo y conductor.
 * Se bloquea si el peso o el volumen pasan del 100 % (con el exceso exacto en kg y m³)
 * o si falta el conductor o el vehículo. El back vuelve a validar todo al aprobar.
 */
export function AprobarLoteDialog({
  abierto,
  onOpenChange,
  titulo,
  conductor,
  vehiculo,
  cantidadPedidos,
  peso,
  volumen,
  aprobando,
  onConfirmar,
}: AprobarLoteDialogProps) {
  const capacidades = [calcularCapacidad("peso", peso), calcularCapacidad("volumen", volumen)];
  const porCapacidad = puedeAprobarPorCapacidad(capacidades);
  const motivos = [
    ...(conductor ? [] : ["El lote no tiene conductor propuesto."]),
    ...(vehiculo ? [] : ["El lote no tiene vehículo asignado."]),
    ...porCapacidad.motivos,
  ];
  const bloqueado = motivos.length > 0;

  return (
    <Dialog open={abierto} onOpenChange={(valor) => !aprobando && onOpenChange(valor)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aprobar {titulo}</DialogTitle>
          <DialogDescription>
            Se confirman juntos el lote, sus {cantidadPedidos} {cantidadPedidos === 1 ? "pedido" : "pedidos"}, el vehículo y el conductor.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Conductor:</dt>
            <dd className="font-medium">{conductor ?? "Sin conductor"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Vehículo:</dt>
            <dd className="font-medium">{vehiculo ?? "Sin vehículo"}</dd>
          </div>
        </dl>

        <div className="space-y-3">
          {capacidades.map((capacidad) => <BarraCapacidad key={capacidad.medida} capacidad={capacidad} />)}
        </div>

        {bloqueado && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            <p className="flex items-center gap-1.5 font-medium">
              <Ban className="size-4" aria-hidden /> No se puede aprobar todavía
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-6">
              {motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={aprobando}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirmar} disabled={aprobando || bloqueado}>
            {aprobando ? "Aprobando..." : "Aprobar lote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
