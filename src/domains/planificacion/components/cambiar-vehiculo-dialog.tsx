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
  /** En un lote confirmado el cambio exige motivo y revoca una aceptación previa. */
  requiereMotivo?: boolean;
  onConfirmar: (vehicleId: number, reason?: string) => void;
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
  requiereMotivo = false,
  onConfirmar,
  onCerrar,
}: Omit<CambiarVehiculoDialogProps, "abierto" | "onOpenChange"> & { onCerrar: () => void }) {
  const [elegido, setElegido] = useState(vehiculoActualId ? String(vehiculoActualId) : "");
  const [motivo, setMotivo] = useState("");
  const [validacion, setValidacion] = useState("");
  const vehiculo = opciones.find((opcion) => String(opcion.id) === elegido);
  const sinCambios = elegido === "" || Number(elegido) === vehiculoActualId;

  const confirmar = () => {
    setValidacion("");
    if (requiereMotivo && !motivo.trim()) {
      setValidacion("Escribe el motivo del cambio de vehículo.");
      return;
    }
    onConfirmar(Number(elegido), motivo.trim() || undefined);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cambiar vehículo del lote</DialogTitle>
        <DialogDescription>
          {requiereMotivo
            ? "El lote confirmado conserva sus paradas y repartidor. Si ya fue aceptado, el repartidor deberá aceptarlo de nuevo."
            : "Al guardar se valida que el peso, el volumen y las medidas de los bultos entren."}
        </DialogDescription>
      </DialogHeader>

      {validacion && <p role="alert" className="text-sm text-destructive">{validacion}</p>}

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

      {requiereMotivo && (
        <div className="space-y-2">
          <Label htmlFor="motivo-cambio-vehiculo">Motivo</Label>
          <Textarea
            id="motivo-cambio-vehiculo"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            aria-invalid={!!validacion && !motivo.trim()}
            placeholder="Explica por qué se reemplaza el vehículo"
            required
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="button" onClick={confirmar} disabled={guardando || sinCambios}>
          {guardando ? "Validando..." : "Cambiar vehículo"}
        </Button>
      </DialogFooter>
    </>
  );
}
