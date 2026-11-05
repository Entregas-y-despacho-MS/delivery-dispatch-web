import { useState, type FormEvent } from "react";
import { LoaderCircle, Power } from "lucide-react";
import { Link } from "react-router-dom";

import { parseApiError } from "@/shared/lib/api-error";
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
import { vehiculosService } from "../services/vehiculos.service";
import type { CambiarEstadoVehiculoInput, EstadoOperativoVehiculo, Vehiculo } from "../flota.types";

const ESTADOS: { value: EstadoOperativoVehiculo; label: string }[] = [
  { value: "active", label: "Disponible" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "out_of_service", label: "Fuera de servicio" },
];

const ESTADO_LOTE_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  in_execution: "En ejecución",
};

interface CambiarEstadoDialogProps {
  abierto: boolean;
  vehiculo: Vehiculo | null;
  guardando: boolean;
  onOpenChange: (abierto: boolean) => void;
  onConfirmar: (payload: CambiarEstadoVehiculoInput) => Promise<void>;
}

export function CambiarEstadoDialog({
  abierto,
  vehiculo,
  guardando,
  onOpenChange,
  onConfirmar,
}: CambiarEstadoDialogProps) {
  const [status, setStatus] = useState<EstadoOperativoVehiculo | "">("");
  const [reason, setReason] = useState("");
  const [validacion, setValidacion] = useState("");
  const [error, setError] = useState("");
  const [lotes, setLotes] = useState<{ id: number; shiftDate: string; status?: string }[]>([]);
  const [consultandoLotes, setConsultandoLotes] = useState(false);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidacion("");
    setError("");
    setLotes([]);

    if (!status) {
      setValidacion("Selecciona el nuevo estado del vehículo.");
      return;
    }
    if (!reason.trim()) {
      setValidacion("Escribe el motivo del cambio de estado.");
      return;
    }

    try {
      await onConfirmar({ status, reason: reason.trim() });
      onOpenChange(false);
    } catch (cause) {
      const parsed = parseApiError(cause);
      if (parsed.code === "VEHICLE_HAS_ACTIVE_BATCHES") {
        const afectados = parsed.details?.batches ?? [];
        setLotes(afectados);
        if (!afectados.length) {
          setError(parsed.message);
          return;
        }
        setConsultandoLotes(true);
        const estados = await Promise.allSettled(afectados.map((lote) => vehiculosService.getRouteBatchStatus(lote.id)));
        setLotes(afectados.map((lote, index) => ({
          ...lote,
          ...(estados[index].status === "fulfilled" ? { status: estados[index].value } : {}),
        })));
        setConsultandoLotes(false);
        return;
      }
      setError(parsed.message);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Power aria-hidden /> Cambiar estado</DialogTitle>
          <DialogDescription>
            {vehiculo ? `${vehiculo.plate} · ${vehiculo.type} ${vehiculo.model}` : "Selecciona un nuevo estado e indica el motivo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-5" noValidate>
          {validacion && <p role="alert" className="text-sm text-destructive">{validacion}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="vehiculo-nuevo-estado">Nuevo estado</Label>
            <Select value={status} onValueChange={(value) => {
              setStatus(value as EstadoOperativoVehiculo);
              setLotes([]);
              setError("");
            }}>
              <SelectTrigger id="vehiculo-nuevo-estado" aria-invalid={!!validacion && !status} className="w-full">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((estado) => <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehiculo-motivo-estado">Motivo</Label>
            <Textarea
              id="vehiculo-motivo-estado"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setLotes([]);
                setError("");
              }}
              aria-invalid={!!validacion && !reason.trim()}
              aria-describedby="vehiculo-motivo-ayuda"
              placeholder="Explica por qué cambia el estado"
              required
            />
            <p id="vehiculo-motivo-ayuda" className="text-xs text-muted-foreground">El motivo quedará registrado en la auditoría.</p>
          </div>

          {lotes.length > 0 && (
            <section role="alert" aria-label="Lotes que impiden cambiar el estado" className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
              <p className="text-sm font-medium">No se puede retirar este vehículo: tiene lotes activos.</p>
              {consultandoLotes && <p className="text-xs text-muted-foreground">Consultando estado de los lotes…</p>}
              <ul className="space-y-1 text-sm">
                {lotes.map((lote) => (
                  <li key={lote.id} className="space-y-1">
                    <p>Lote #{lote.id} · {lote.shiftDate}{lote.status ? ` · ${ESTADO_LOTE_LABEL[lote.status] ?? lote.status}` : ""}</p>
                    {lote.status === "in_execution" && (
                      <Link className="text-primary underline underline-offset-4" to="/app/mapa">
                        Abrir mapa para reasignar
                      </Link>
                    )}
                    {lote.status === "confirmed" && (
                      <p className="text-xs text-muted-foreground">El lote confirmado no permite cambiar el vehículo desde esta pantalla.</p>
                    )}
                    {!consultandoLotes && !lote.status && (
                      <p className="text-xs text-muted-foreground">No se pudo consultar el estado del lote; conserva la referencia para revisarlo.</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
            <Button type="submit" disabled={guardando || !vehiculo}>
              {guardando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              {guardando ? "Guardando…" : "Guardar estado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
