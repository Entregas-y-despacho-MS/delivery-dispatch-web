import type { ReactNode } from "react";
import { Star } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { etiquetaEstadoDespacho, formatearFechaHoraExacta } from "../despacho-detalle.format";
import type { DespachoDetalle } from "../despacho-detalle.types";
import { FichaEvidencias } from "./ficha-evidencias";
import { FichaGeneral } from "./ficha-general";
import { FichaIncidencias } from "./ficha-incidencias";
import { FichaLineaTiempo } from "./ficha-linea-tiempo";
import { FichaRecepcion } from "./ficha-recepcion";
import { PrioridadBadge } from "./pedido-badges";

export type PestanaFicha = "general" | "linea-tiempo" | "evidencias" | "incidencias";

interface DespachoFichaProps {
  despacho: DespachoDetalle;
  /** Pide el detalle otra vez (renueva las URL de las evidencias). */
  onRenovar: () => void;
  renovando: boolean;
  /** Pestaña inicial; por defecto General. */
  pestana?: PestanaFicha;
  /** Botones de acción junto al título (p. ej. Reprogramar). */
  acciones?: ReactNode;
  /** Solo para pruebas: instante fijo en vez del reloj real. */
  ahora?: number;
}

/**
 * Ficha 360° del despacho (ST-56.1, RF-A09) con pestañas General, Línea de tiempo, Evidencias digitales
 * e Incidencias (incluye reprogramaciones).
 */
export function DespachoFicha({ despacho, onRenovar, renovando, pestana = "general", acciones, ahora }: DespachoFichaProps) {
  const cantidad = (n: number) => (n > 0 ? ` (${n})` : "");
  const opinion = despacho.rating;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{despacho.sourceOrderRef}</h2>
            <Badge variant="outline">{etiquetaEstadoDespacho(despacho.status.name)}</Badge>
            <PrioridadBadge priority={despacho.priority === "urgent" ? "urgent" : "normal"} />
          </div>
          <p className="text-sm text-muted-foreground">
            {[despacho.trackingCode && `Seguimiento ${despacho.trackingCode}`, despacho.type.name].filter(Boolean).join(" · ")}
          </p>
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>

      <Tabs defaultValue={pestana}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="linea-tiempo">{`Línea de tiempo${cantidad(despacho.timeline.length)}`}</TabsTrigger>
          <TabsTrigger value="evidencias">{`Evidencias${cantidad(despacho.evidences.length)}`}</TabsTrigger>
          <TabsTrigger value="incidencias">{`Incidencias${cantidad(despacho.incidents.length + despacho.reschedules.length)}`}</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="pt-3"><FichaGeneral despacho={despacho} /></TabsContent>
        <TabsContent value="linea-tiempo" className="pt-3"><FichaLineaTiempo eventos={despacho.timeline} receptor={despacho.receiver} /></TabsContent>
        <TabsContent value="evidencias" className="pt-3">
          <FichaEvidencias evidencias={despacho.evidences} onRenovar={onRenovar} renovando={renovando} ahora={ahora} />
        </TabsContent>
        <TabsContent value="incidencias" className="pt-3">
          <FichaIncidencias incidencias={despacho.incidents} reprogramaciones={despacho.reschedules} />
        </TabsContent>
      </Tabs>

      <section className="space-y-2 rounded-lg border p-4" aria-label="Opinión del cliente">
        <h3 className="text-sm font-semibold">Opinión del cliente</h3>
        {opinion ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex gap-0.5" role="img" aria-label={`${opinion.score} de 5 estrellas`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index + 1}
                    aria-hidden
                    className={`size-4 ${index < opinion.score ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
                  />
                ))}
              </span>
              <span className="text-sm font-medium">{opinion.score}/5</span>
              <span className="text-xs text-muted-foreground">{formatearFechaHoraExacta(opinion.createdAt)}</span>
            </div>
            <p className="text-sm">{opinion.comment || <span className="text-muted-foreground">El cliente no dejó un comentario.</span>}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">El cliente todavía no calificó la entrega.</p>
        )}
      </section>

      {/* Solo recojos y recogidas pasan por almacén: sin recepción la sección no se muestra. */}
      {despacho.receipt && <FichaRecepcion recepcion={despacho.receipt} />}
    </div>
  );
}
