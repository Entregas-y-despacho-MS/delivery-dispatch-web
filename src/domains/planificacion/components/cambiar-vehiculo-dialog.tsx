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
import { formatearKilos, formatearMetrosCubicos } from "../planificacion.format";

/** Vehículo que se puede elegir; la página lo arma con los datos de flota. */
export interface OpcionVehiculo {
  id: number;
  /** Placa y modelo, p. ej. «2345-ABC · Hyundai H100». */
  etiqueta: string;
  capacidadKg: number;
  capacidadM3: number;
}

interface CambiarVehiculoDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  vehiculoActualId: number | null;
  /** Solo vehículos activos. */
  opciones: OpcionVehiculo[];
  guardando: boolean;
  onConfirmar: (vehicleId: number) => void;
}

/**
 * Cambio del vehículo propuesto (ST-215.1). La capacidad la valida el back:
 * si la carga no entra responde 409 ROUTE_CAPACITY_EXCEEDED y el hook muestra el motivo.
 */
export function CambiarVehiculoDialog({ abierto, onOpenChange, ...resto }: CambiarVehiculoDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => !resto.guardando && onOpenChange(valor)}>
      <DialogContent className="sm:max-w-md">
        {/* Se monta al abrir: cada vez arranca con el vehículo actual. */}
        {abierto && <Contenido {...resto} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({
  vehiculoActualId,
  opciones,
  guardando,
  onConfirmar,
  onCerrar,
}: Omit<CambiarVehiculoDialogProps, "abierto" | "onOpenChange"> & { onCerrar: () => void }) {
  const [elegido, setElegido] = useState(vehiculoActualId ? String(vehiculoActualId) : "");
  const vehiculo = opciones.find((opcion) => String(opcion.id) === elegido);
  const sinCambios = elegido === "" || Number(elegido) === vehiculoActualId;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cambiar vehículo del lote</DialogTitle>
        <DialogDescription>Al guardar se valida que el peso, el volumen y las medidas de los bultos entren.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="vehiculo-lote">Vehículo</Label>
        <Select value={elegido} onValueChange={setElegido} disabled={guardando || opciones.length === 0}>
          <SelectTrigger id="vehiculo-lote" className="w-full">
            <SelectValue placeholder={opciones.length === 0 ? "No hay vehículos activos" : "Elige un vehículo"} />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((opcion) => (
              <SelectItem key={opcion.id} value={String(opcion.id)}>{opcion.etiqueta}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {vehiculo && (
          <p className="text-xs text-muted-foreground">
            Capacidad: {formatearKilos(vehiculo.capacidadKg)} · {formatearMetrosCubicos(vehiculo.capacidadM3)}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => onConfirmar(Number(elegido))} disabled={guardando || sinCambios}>
          {guardando ? "Validando..." : "Cambiar vehículo"}
        </Button>
      </DialogFooter>
    </>
  );
}
