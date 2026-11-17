import { useState } from "react";
import { AlertTriangle, Ban, CalendarClock, ImageIcon, PackageX } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { FormDialogContent, FormDialogFooter } from "@/shared/components/common/form-dialog";
import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatearFechaHoraExacta } from "../despacho-detalle.format";
import type { DespachoDetalle } from "../types/despacho-detalle.types";
import { useAhora } from "../hooks/use-ahora";
import {
  contarIntentos,
  estadoIntentos,
  hoyEnBolivia,
  puedeDevolver,
  ventanaUtc,
  type Franja,
} from "../reprogramacion.reglas";
import type { ReprogramarPayload } from "../services/reprogramacion.service";
import { EvidenciaVisor } from "./evidencia-visor";

export interface MotivoOpcion {
  code: string;
  name: string;
}

interface ReprogramarDespachoDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  despacho: DespachoDetalle;
  /** Motivos activos del catálogo reschedule_reasons. */
  motivos: MotivoOpcion[];
  /** Franjas configuradas (mañana y tarde cortadas por slot_duration_minutes). */
  franjas: Franja[];
  /** Parámetro max_delivery_attempts. */
  limiteIntentos: number;
  enviando: boolean;
  devolviendo: boolean;
  /** Mensaje del último 400/409 del back. */
  error: string | null;
  onReprogramar: (payload: ReprogramarPayload) => void;
  onDevolver: (notas: string | null) => void;
  /** Renueva las URL de las fotos (pide el detalle otra vez). */
  onRenovarFotos: () => void;
  renovandoFotos: boolean;
  /** Solo para pruebas: instante fijo en vez del reloj real. */
  ahora?: number;
}

const CLASE_SELECT = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

/**
 * Modal de reprogramación del coordinador (ST-52.1, RF-A05): historial de intentos con notas y fotos de
 * fachada, «Intento n de N», aviso del último intento y, con el límite alcanzado, solo devolver al almacén.
 */
export function ReprogramarDespachoDialog({ abierto, onOpenChange, ...resto }: ReprogramarDespachoDialogProps) {
  const ocupado = resto.enviando || resto.devolviendo;
  return (
    <Dialog open={abierto} onOpenChange={(valor) => !ocupado && onOpenChange(valor)}>
      <FormDialogContent className="sm:max-w-3xl">
        {abierto && <Contenido {...resto} onCerrar={() => onOpenChange(false)} />}
      </FormDialogContent>
    </Dialog>
  );
}

function Contenido({
  despacho, motivos, franjas, limiteIntentos, enviando, devolviendo, error, onReprogramar, onDevolver, onRenovarFotos, renovandoFotos, ahora, onCerrar,
}: Omit<ReprogramarDespachoDialogProps, "abierto" | "onOpenChange"> & { onCerrar: () => void }) {
  const reloj = useAhora(ahora);
  const hoy = hoyEnBolivia(reloj);
  const intentos = estadoIntentos(contarIntentos(despacho), limiteIntentos);
  const fotos = despacho.evidences.filter((evidencia) => evidencia.type === "photo");
  const noEntregas = despacho.timeline.filter((evento) => evento.status === "not_delivered");
  const sePuedeDevolver = puedeDevolver(despacho.status.name);

  const [fecha, setFecha] = useState(hoy);
  const [franja, setFranja] = useState("");
  const [motivo, setMotivo] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [notasDevolucion, setNotasDevolucion] = useState("");
  const [fotoId, setFotoId] = useState<string | null>(null);

  const franjaElegida = franjas.find((f) => `${f.inicio}-${f.fin}` === franja);
  const fechaValida = fecha !== "" && fecha >= hoy;
  const listo = !intentos.alcanzado && fechaValida && franjaElegida !== undefined && motivo !== "";
  const ocupado = enviando || devolviendo;

  const enviar = () => {
    if (!listo || !franjaElegida) return;
    const texto = instrucciones.trim();
    onReprogramar({ reasonCode: motivo, ...ventanaUtc(fecha, franjaElegida), instructions: texto === "" ? null : texto });
  };

  return (
    <>
      <FormDialogHeader
        icon={CalendarClock}
        title={<span className="flex flex-wrap items-center gap-2">{`Reprogramar ${despacho.sourceOrderRef}`}<Badge variant={intentos.alcanzado ? "destructive" : "outline"}>{`Intento ${intentos.siguiente} de ${intentos.limite}`}</Badge></span>}
        description="Cuentan las entregas no concretadas, no las reprogramaciones. El pedido sale de su ruta y vuelve al plan en la fecha pactada."
      />

      <section className="space-y-2" aria-label="Historial del pedido">
        <h3 className="text-sm font-semibold">Historial del pedido</h3>
        {despacho.incidents.length === 0 && noEntregas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin intentos fallidos registrados.</p>
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {noEntregas.map((evento) => (
              <li key={`ne-${evento.id}`} className="p-2">
                <span className="font-medium">No entregado</span>
                <span className="text-muted-foreground">{` · ${formatearFechaHoraExacta(evento.occurredAt)}${evento.reason ? ` · ${evento.reason}` : ""}`}</span>
              </li>
            ))}
            {despacho.incidents.map((incidencia) => (
              <li key={incidencia.id} className="p-2">
                <span className="font-medium">{incidencia.reasonName}</span>
                <span className="text-muted-foreground">{` · ${formatearFechaHoraExacta(incidencia.occurredAt)}`}</span>
                <p className="text-muted-foreground">{incidencia.description ? `Nota del conductor: ${incidencia.description}` : "Sin nota del conductor."}</p>
              </li>
            ))}
          </ul>
        )}
        {fotos.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Fotos de fachada">
            {fotos.map((foto) => (
              <Button key={foto.id} type="button" size="sm" variant="outline" onClick={() => setFotoId(foto.id)}>
                <ImageIcon aria-hidden /> {`Foto ${formatearFechaHoraExacta(foto.capturedAt)}`}
              </Button>
            ))}
          </div>
        )}
      </section>

      {intentos.alcanzado ? (
        <section className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-3" role="alert" aria-label="Límite de reintentos">
          <p className="flex items-center gap-2 font-medium text-destructive"><Ban className="size-4" aria-hidden /> Límite de reintentos alcanzado</p>
          <p className="text-sm">{`Ya se usaron ${intentos.usados} de ${intentos.limite} intentos. No se puede reprogramar otra vez.`}</p>
          {sePuedeDevolver ? (
            <div className="space-y-1.5">
              <Label htmlFor="notas-devolucion">Nota para la devolución (opcional)</Label>
              <Textarea id="notas-devolucion" maxLength={500} rows={2} value={notasDevolucion} onChange={(e) => setNotasDevolucion(e.target.value)} disabled={ocupado} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Solo un despacho con incidencia o no entregado puede volver al almacén.</p>
          )}
        </section>
      ) : (
        <form
          id="form-reprogramar"
          className="space-y-3"
          aria-label="Datos de la reprogramación"
          onSubmit={(evento) => {
            evento.preventDefault();
            enviar();
          }}
        >
          {intentos.ultimo && (
            <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning" role="status">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              Este es el último intento permitido. Si vuelve a fallar, el pedido tendrá que volver al almacén.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fecha-pactada">Nueva fecha pactada</Label>
              <Input id="fecha-pactada" type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={ocupado} required />
              {!fechaValida && <p className="text-xs text-destructive">La fecha no puede ser anterior a hoy.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="franja-pactada">Franja</Label>
              <select id="franja-pactada" className={CLASE_SELECT} value={franja} onChange={(e) => setFranja(e.target.value)} disabled={ocupado || franjas.length === 0} required>
                <option value="">{franjas.length === 0 ? "No hay franjas configuradas" : "Elige una franja"}</option>
                {franjas.map((f) => (
                  <option key={`${f.inicio}-${f.fin}`} value={`${f.inicio}-${f.fin}`}>{`${f.inicio}–${f.fin} (${Number(f.inicio.slice(0, 2)) < 12 ? "mañana" : "tarde"})`}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motivo-reprogramacion">Motivo</Label>
            <select id="motivo-reprogramacion" className={CLASE_SELECT} value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={ocupado || motivos.length === 0} required>
              <option value="">{motivos.length === 0 ? "No hay motivos activos" : "Elige un motivo"}</option>
              {motivos.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instrucciones">Instrucciones especiales (opcional)</Label>
            <Textarea id="instrucciones" maxLength={500} rows={2} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} disabled={ocupado} placeholder="Por ejemplo: llamar al cliente 30 minutos antes de llegar." />
          </div>
        </form>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <FormDialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar} disabled={ocupado}>Cancelar</Button>
        {intentos.alcanzado ? (
          sePuedeDevolver && (
            <Button type="button" variant="destructive" disabled={ocupado} onClick={() => onDevolver(notasDevolucion.trim() || null)}>
              <PackageX aria-hidden /> {devolviendo ? "Devolviendo..." : "Devolver al almacén"}
            </Button>
          )
        ) : (
          <Button type="submit" form="form-reprogramar" disabled={ocupado || !listo}>
            <CalendarClock aria-hidden /> {enviando ? "Reprogramando..." : "Reprogramar"}
          </Button>
        )}
      </FormDialogFooter>

      <EvidenciaVisor
        evidencia={fotos.find((foto) => foto.id === fotoId) ?? null}
        onCerrar={() => setFotoId(null)}
        onRenovar={onRenovarFotos}
        renovando={renovandoFotos}
        ahora={ahora}
      />
    </>
  );
}
