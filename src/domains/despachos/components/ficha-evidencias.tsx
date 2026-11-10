import { useState } from "react";
import { FileSignature, ImageIcon, KeyRound } from "lucide-react";

import { useAhora } from "../hooks/use-ahora";
import { etiquetaEvidencia, formatearFechaHoraExacta, urlVencida } from "../despacho-detalle.format";
import type { EvidenciaDetalle } from "../types/despacho-detalle.types";
import { EvidenciaVisor } from "./evidencia-visor";

interface FichaEvidenciasProps {
  evidencias: EvidenciaDetalle[];
  onRenovar: () => void;
  renovando: boolean;
  ahora?: number;
}

const ICONO = { photo: ImageIcon, signature: FileSignature, otp: KeyRound } as const;

/** Pestaña Evidencias digitales: miniaturas que abren el visor; un OTP se lista sin archivo. */
export function FichaEvidencias({ evidencias, onRenovar, renovando, ahora }: FichaEvidenciasProps) {
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const reloj = useAhora(ahora);
  // Se busca por id en la lista vigente: tras renovar, el visor recibe la URL nueva.
  const abierta = evidencias.find((evidencia) => evidencia.id === abiertaId) ?? null;

  if (evidencias.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">El despacho no tiene evidencias digitales todavía.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Evidencias digitales">
        {evidencias.map((evidencia) => {
          const Icono = ICONO[evidencia.type];
          const conArchivo = evidencia.accessUrl !== null;
          const mostrarMiniatura = conArchivo && !urlVencida(evidencia, reloj);
          return (
            <li key={evidencia.id}>
              <button
                type="button"
                disabled={!conArchivo}
                onClick={() => {
                  setAbiertaId(evidencia.id);
                  // Abrir con una URL vencida pide una nueva de inmediato (ES-179).
                  if (urlVencida(evidencia, ahora ?? Date.now()) && !renovando) onRenovar();
                }}
                aria-label={`Ver ${etiquetaEvidencia(evidencia.type).toLowerCase()} del ${formatearFechaHoraExacta(evidencia.capturedAt)}`}
                className="group w-full overflow-hidden rounded-lg border text-left transition-colors enabled:hover:bg-muted disabled:cursor-default"
              >
                <div className="flex aspect-video items-center justify-center bg-muted/40">
                  {mostrarMiniatura
                    ? <img src={evidencia.accessUrl ?? undefined} alt="" className="size-full object-cover" loading="lazy" />
                    : <Icono className="size-8 text-muted-foreground" aria-hidden />}
                </div>
                <div className="p-2 text-xs">
                  <p className="font-medium">{etiquetaEvidencia(evidencia.type)}</p>
                  <p className="text-muted-foreground">{conArchivo ? formatearFechaHoraExacta(evidencia.capturedAt) : "Validado, sin archivo"}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <EvidenciaVisor evidencia={abierta} onCerrar={() => setAbiertaId(null)} onRenovar={onRenovar} renovando={renovando} ahora={reloj} />
    </>
  );
}
