import { useState } from "react";
import { MapPin, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { useAhora } from "../hooks/use-ahora";
import { enlaceMapa, etiquetaEvidencia, formatearCoordenadas, formatearFechaHoraExacta, urlVencida } from "../despacho-detalle.format";
import type { EvidenciaDetalle } from "../types/despacho-detalle.types";

const NIVELES_ZOOM = [1, 1.5, 2, 3] as const;

interface EvidenciaVisorProps {
  /** Evidencia actual (la página la vuelve a pasar con URL nueva tras renovar). null = cerrado. */
  evidencia: EvidenciaDetalle | null;
  onCerrar: () => void;
  /** Pide el detalle otra vez para obtener URL nuevas. */
  onRenovar: () => void;
  renovando: boolean;
  /** Solo para pruebas: instante fijo en vez del reloj real. */
  ahora?: number;
}

/**
 * Visor modal de fotos y firmas en alta resolución (escenario 2 de ES-56), con zoom y metadatos de captura.
 * La URL firmada vence a los 5 minutos: quien abre el visor pide una nueva si ya venció, y si la imagen
 * no carga se pide otra una sola vez por URL. Mientras tanto se muestra que se está renovando.
 */
export function EvidenciaVisor({ evidencia, onCerrar, onRenovar, renovando, ahora }: EvidenciaVisorProps) {
  return (
    <Dialog open={evidencia !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="sm:max-w-3xl">
        {evidencia && <Contenido key={evidencia.id} evidencia={evidencia} onRenovar={onRenovar} renovando={renovando} ahora={ahora} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ evidencia, onRenovar, renovando, ahora }: Omit<EvidenciaVisorProps, "evidencia" | "onCerrar"> & { evidencia: EvidenciaDetalle }) {
  const [zoom, setZoom] = useState(0);
  // URL que ya falló al cargar: no se vuelve a pedir en bucle si el archivo no existe.
  const [urlFallida, setUrlFallida] = useState<string | null>(null);
  const reloj = useAhora(ahora);
  const vencida = urlVencida(evidencia, reloj);
  const fallo = urlFallida !== null && urlFallida === evidencia.accessUrl;
  const coordenadas = formatearCoordenadas(evidencia.latitude, evidencia.longitude);

  const alFallar = () => {
    if (!evidencia.accessUrl) return;
    setUrlFallida(evidencia.accessUrl);
    if (!renovando) onRenovar();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{etiquetaEvidencia(evidencia.type)}</DialogTitle>
        <DialogDescription>
          {`Capturada el ${formatearFechaHoraExacta(evidencia.capturedAt)}`}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" aria-label="Alejar" onClick={() => setZoom((n) => Math.max(0, n - 1))} disabled={zoom === 0}>
          <ZoomOut aria-hidden />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums" aria-live="polite">{`${NIVELES_ZOOM[zoom] * 100} %`}</span>
        <Button type="button" size="icon" variant="outline" aria-label="Acercar" onClick={() => setZoom((n) => Math.min(NIVELES_ZOOM.length - 1, n + 1))} disabled={zoom === NIVELES_ZOOM.length - 1}>
          <ZoomIn aria-hidden />
        </Button>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30">
        {vencida || renovando ? (
          <div className="space-y-2 p-10 text-center text-sm text-muted-foreground" role="status">
            <p className="flex items-center justify-center gap-2">
              <RefreshCw className={renovando ? "size-4 animate-spin" : "size-4"} aria-hidden /> El enlace de la imagen venció. {renovando ? "Pidiendo uno nuevo..." : ""}
            </p>
            {!renovando && <Button type="button" size="sm" variant="outline" onClick={onRenovar}>Pedir un enlace nuevo</Button>}
          </div>
        ) : fallo ? (
          <div className="space-y-2 p-10 text-center text-sm" role="alert">
            <p>No se pudo cargar la imagen.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => { setUrlFallida(null); onRenovar(); }}>
              <RefreshCw aria-hidden /> Reintentar
            </Button>
          </div>
        ) : evidencia.accessUrl ? (
          <img
            src={evidencia.accessUrl}
            alt={`${etiquetaEvidencia(evidencia.type)} capturada el ${formatearFechaHoraExacta(evidencia.capturedAt)}`}
            onError={alFallar}
            style={{ width: `${NIVELES_ZOOM[zoom] * 100}%`, maxWidth: "none" }}
            className="mx-auto block"
          />
        ) : (
          <p className="p-10 text-center text-sm text-muted-foreground">Esta evidencia no tiene archivo.</p>
        )}
      </div>

      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="text-muted-foreground">Fecha y hora</dt>
        <dd>{formatearFechaHoraExacta(evidencia.capturedAt)}</dd>
        <dt className="text-muted-foreground">Ubicación</dt>
        <dd>
          {coordenadas && evidencia.latitude !== null && evidencia.longitude !== null ? (
            <a className="inline-flex items-center gap-1 underline underline-offset-4" href={enlaceMapa(evidencia.latitude, evidencia.longitude)} target="_blank" rel="noreferrer">
              <MapPin className="size-3.5" aria-hidden />{coordenadas}
            </a>
          ) : "El dispositivo no registró ubicación"}
        </dd>
        {evidencia.receiverName && (
          <>
            <dt className="text-muted-foreground">Recibió</dt>
            <dd>{`${evidencia.receiverName}${evidencia.receiverDocument ? ` (${evidencia.receiverDocument})` : ""}`}</dd>
          </>
        )}
      </dl>
    </>
  );
}
