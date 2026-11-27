import { useState } from "react";
import { Gavel, PackageSearch } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  CODIGOS_DICTAMEN,
  DICTAMENES,
  MAX_HALLAZGOS,
  MAX_MOTIVO_DICTAMEN,
  dictamenListo,
  validarDictamen,
  type BorradorDictamen,
} from "../reclamos.reglas";
import type { DictamenInput, ItemAfectado } from "../types/reclamos.types";

interface DictamenFormProps {
  borrador: BorradorDictamen;
  onCambiar: (borrador: BorradorDictamen) => void;
  items: ItemAfectado[];
  enviando: boolean;
  onEmitir: (dictamen: DictamenInput) => void;
}

/**
 * Hallazgos y uno de los tres dictámenes (ST-45.3). El borrador vive fuera del formulario: un error o una
 * versión nueva del caso no lo borran. Para request_RMA se muestran los ítems y se explica que va a Inventarios.
 */
export function DictamenForm({ borrador, onCambiar, items, enviando, onEmitir }: DictamenFormProps) {
  const [intentado, setIntentado] = useState(false);
  const errores = intentado ? validarDictamen(borrador) : {};
  const cambiar = (cambios: Partial<BorradorDictamen>) => onCambiar({ ...borrador, ...cambios });

  return (
    <form
      className="space-y-4"
      aria-label="Emitir dictamen"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        setIntentado(true);
        const listo = dictamenListo(borrador);
        if (listo) onEmitir(listo);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="dictamen-hallazgos">Hallazgos de la investigación</Label>
        <Textarea id="dictamen-hallazgos" rows={4} maxLength={MAX_HALLAZGOS} value={borrador.findings} disabled={enviando}
          aria-invalid={Boolean(errores.findings) || undefined} aria-describedby="dictamen-hallazgos-ayuda"
          onChange={(e) => cambiar({ findings: e.target.value })} />
        <p id="dictamen-hallazgos-ayuda" className={errores.findings ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {errores.findings ?? "Texto simple, sin enlaces: la evidencia se referencia, no se publica."}
        </p>
      </div>

      <fieldset className="space-y-2" aria-describedby={errores.verdict ? "dictamen-error" : undefined}>
        <legend className="text-sm font-medium">Dictamen</legend>
        {CODIGOS_DICTAMEN.map((codigo) => (
          <label key={codigo} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input type="radio" name="dictamen" value={codigo} className="mt-1 accent-primary" disabled={enviando}
              checked={borrador.verdict === codigo} onChange={() => cambiar({ verdict: codigo })} />
            <span>
              <span className="block text-sm font-medium">{DICTAMENES[codigo].etiqueta}</span>
              <span className="block text-xs text-muted-foreground">{DICTAMENES[codigo].ayuda}</span>
            </span>
          </label>
        ))}
        {errores.verdict && <p id="dictamen-error" className="text-xs text-destructive">{errores.verdict}</p>}
      </fieldset>

      {borrador.verdict === "request_RMA" && (
        <section className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm" aria-label="Solicitud de RMA">
          <p className="flex items-center gap-2 font-medium"><PackageSearch className="size-4" aria-hidden /> Se enviará una solicitud pendiente a Inventarios</p>
          <p className="text-muted-foreground">
            El caso quedará con autorización pendiente. Solo Inventarios aprueba o rechaza el RMA; desde aquí no se crea el recojo ni se cierra el caso del CRM.
          </p>
          {items.length > 0 ? (
            <ul className="space-y-1" aria-label="Ítems afectados">
              {items.map((item) => (
                <li key={`${item.packageId}-${item.itemCode}`} className="flex justify-between gap-2 font-mono text-xs">
                  <span>{item.itemCode} · paquete {item.packageId}</span>
                  <span>{item.quantity} u.</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">El CRM no indicó ítems afectados.</p>
          )}
        </section>
      )}

      <div className="space-y-2">
        <Label htmlFor="dictamen-motivo">{borrador.verdict === "request_RMA" ? "Motivo de la solicitud de RMA" : "Motivo del dictamen"}</Label>
        <Textarea id="dictamen-motivo" rows={2} maxLength={MAX_MOTIVO_DICTAMEN} value={borrador.decisionReason} disabled={enviando}
          aria-invalid={Boolean(errores.decisionReason) || undefined} aria-describedby="dictamen-motivo-ayuda"
          onChange={(e) => cambiar({ decisionReason: e.target.value })} />
        <p id="dictamen-motivo-ayuda" className={errores.decisionReason ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {errores.decisionReason ?? `${borrador.decisionReason.trim().length}/${MAX_MOTIVO_DICTAMEN} caracteres`}
        </p>
      </div>

      <Button type="submit" disabled={enviando}>
        <Gavel aria-hidden /> {enviando ? "Emitiendo..." : "Emitir dictamen"}
      </Button>
    </form>
  );
}
