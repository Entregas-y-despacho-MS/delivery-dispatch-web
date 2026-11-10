import { useState } from "react";
import { Ban, CalendarClock, ImageIcon, PackageCheck, PackageX, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";

import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { formatearFechaHoraExacta, formatearFechaTurnoDetalle } from "../despacho-detalle.format";
import { codigoParada, etiquetaMotivoFalla } from "../excluidos-cotejo.reglas";
import type { ExcluidoCotejo, FallaCotejo } from "../types/excluidos-cotejo.types";

export interface ExcluidosCotejoPanelProps {
  data: ExcluidoCotejo[];
  cargando: boolean;
  error?: unknown;
  onReintentar: () => void;
  /** Vuelve a pedir la lista (renueva las URL de las fotos). */
  actualizando: boolean;
  /** Solo el coordinador reprograma, cancela o marca resuelto; el supervisor solo mira. */
  puedeActuar: boolean;
  onReprogramar: (parada: ExcluidoCotejo) => void;
  onCancelar: (parada: ExcluidoCotejo) => void;
  onResolver: (parada: ExcluidoCotejo) => void;
  hrefFicha: (id: number) => string;
}

/**
 * Paradas que quedaron fuera de la ruta por falla de cotejo (ST-241.4, ES-241 escenario 2). Si no hay
 * ninguna el panel no ocupa lugar. Cada parada muestra sus bultos fallados con motivo y foto.
 */
export function ExcluidosCotejoPanel(props: ExcluidosCotejoPanelProps) {
  const { data, cargando, error, onReintentar, actualizando } = props;
  const [foto, setFoto] = useState<{ codigo: string; falla: FallaCotejo } | null>(null);

  if (cargando) return null;
  if (error) {
    return <ErrorAlert error={error} title="No pudimos cargar los excluidos por cotejo" onRetry={onReintentar} isRetrying={actualizando} />;
  }
  if (data.length === 0) return null;

  return (
    <section aria-label="Excluidos por cotejo" className="space-y-3 rounded-xl border border-warning/50 bg-warning/5 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PackageX className="size-4 text-warning" aria-hidden />
          <h2 className="font-semibold">Excluidos por cotejo</h2>
          <Badge variant="outline">{data.length}</Badge>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReintentar} disabled={actualizando}>
          <RotateCw className={actualizando ? "animate-spin" : undefined} aria-hidden /> {actualizando ? "Actualizando…" : "Actualizar"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Estas paradas no salieron con su ruta porque un bulto faltó, llegó dañado o no cupo. Mientras sigan aquí, su lote no puede cerrarse.
      </p>
      <ul className="space-y-3">
        {data.map((p) => <Parada key={p.dispatchId} parada={p} {...props} onVerFoto={(falla) => setFoto({ codigo: codigoParada(p), falla })} />)}
      </ul>
      <FotoCotejoDialog foto={foto} onCerrar={() => setFoto(null)} onActualizar={onReintentar} actualizando={actualizando} />
    </section>
  );
}

function Parada({ parada: p, puedeActuar, onReprogramar, onCancelar, onResolver, hrefFicha, onVerFoto }: ExcluidosCotejoPanelProps & { parada: ExcluidoCotejo; onVerFoto: (f: FallaCotejo) => void }) {
  const codigo = codigoParada(p);
  return (
    <li aria-label={`Parada ${codigo}`} className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <Link to={hrefFicha(p.dispatchId)} className="font-semibold text-primary underline-offset-4 hover:underline" aria-label={`Ver ficha de ${codigo}`}>
            {codigo}
          </Link>
          <p className="text-sm">{p.contactName ?? "Cliente sin nombre"} · {p.deliveryAddress}</p>
          <p className="text-xs text-muted-foreground">
            Lote #{p.routeBatchId} · {formatearFechaTurnoDetalle(p.shiftDate)}{p.sequenceOrder !== null ? ` · parada ${p.sequenceOrder}` : ""}
          </p>
        </div>
        {puedeActuar && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onResolver(p)}><PackageCheck aria-hidden /> Marcar resuelto</Button>
            <Button type="button" size="sm" onClick={() => onReprogramar(p)}><CalendarClock aria-hidden /> Reprogramar</Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => onCancelar(p)}><Ban aria-hidden /> Cancelar</Button>
          </div>
        )}
      </div>
      <ul aria-label={`Bultos con falla de ${codigo}`} className="space-y-2">
        {p.failures.map((f) => (
          <li key={f.packageId + f.reportedAt} className="flex flex-wrap items-start gap-3 rounded-md bg-muted/50 p-2 text-sm">
            {f.photoUrl ? (
              <button type="button" onClick={() => onVerFoto(f)} className="shrink-0 overflow-hidden rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Ver foto del bulto ${f.packageId}`}>
                <img src={f.photoUrl} alt="" className="size-14 object-cover" />
              </button>
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded border text-muted-foreground" title="Sin foto">
                <ImageIcon className="size-5" aria-hidden /><span className="sr-only">Sin foto</span>
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <p><span className="font-medium">{f.packageId}</span> · <Badge variant="secondary">{etiquetaMotivoFalla(f.reason)}</Badge></p>
              {f.detail && <p className="text-muted-foreground">{f.detail}</p>}
              <p className="text-xs text-muted-foreground">Reportado el {formatearFechaHoraExacta(f.reportedAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </li>
  );
}

function FotoCotejoDialog({ foto, onCerrar, onActualizar, actualizando }: {
  foto: { codigo: string; falla: FallaCotejo } | null;
  onCerrar: () => void;
  onActualizar: () => void;
  actualizando: boolean;
}) {
  const [fallida, setFallida] = useState<string | null>(null);
  const url = foto?.falla.photoUrl ?? null;
  return (
    <Dialog open={foto !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="sm:max-w-2xl">
        {foto && (
          <>
            <DialogHeader>
              <DialogTitle>{`Bulto ${foto.falla.packageId} · ${foto.codigo}`}</DialogTitle>
              <DialogDescription>{`${etiquetaMotivoFalla(foto.falla.reason)} · ${formatearFechaHoraExacta(foto.falla.reportedAt)}`}</DialogDescription>
            </DialogHeader>
            {url && fallida !== url ? (
              <img src={url} alt={`Foto del bulto ${foto.falla.packageId}`} className="max-h-[70vh] w-full rounded object-contain" onError={() => setFallida(url)} />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
                <p>La foto venció o no se pudo cargar. Actualiza la lista y ábrela otra vez.</p>
                <Button type="button" variant="outline" onClick={() => { onActualizar(); onCerrar(); }} disabled={actualizando}>
                  <RotateCw aria-hidden /> Actualizar lista
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
