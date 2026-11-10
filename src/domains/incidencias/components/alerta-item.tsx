import { CheckCheck, CircleAlert, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { descripcionAlerta, enlaceAlerta, etiquetaEstadoAlerta, etiquetaTipoAlerta, fechaHoraBolivia } from "../incidencias.alertas";
import type { AlertaOperativa } from "../types/incidencias.types";

interface AlertaItemProps {
  alerta: AlertaOperativa;
  onAtender: (id: number) => void;
  atendiendo: boolean;
}

/** Una alerta del centro: qué pasó, cuándo, a dónde ir y «Marcar atendida» mientras siga abierta. */
export function AlertaItem({ alerta, onAtender, atendiendo }: AlertaItemProps) {
  const critica = alerta.severity === "critical";
  const abierta = alerta.status === "open";
  const enlace = enlaceAlerta(alerta);
  const titulo = etiquetaTipoAlerta(alerta.kind);
  const Icono = critica ? CircleAlert : TriangleAlert;

  return (
    <li
      aria-label={`${titulo}, ${etiquetaEstadoAlerta(alerta.status).toLowerCase()}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-start",
        abierta && (critica ? "border-l-4 border-l-destructive" : "border-l-4 border-l-amber-500"),
        !abierta && "opacity-80",
      )}
    >
      <Icono className={cn("mt-0.5 size-5 shrink-0", critica ? "text-destructive" : "text-amber-500")} aria-hidden />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{titulo}</p>
          <Badge variant={critica ? "destructive" : "outline"}>{critica ? "Crítica" : "Advertencia"}</Badge>
          <Badge variant={abierta ? "secondary" : "outline"}>{etiquetaEstadoAlerta(alerta.status)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{descripcionAlerta(alerta)}</p>
        <p className="text-xs text-muted-foreground">
          Levantada el <time dateTime={alerta.createdAt}>{fechaHoraBolivia(alerta.createdAt)}</time>
          {alerta.acknowledgedAt && (
            <> · Atendida el <time dateTime={alerta.acknowledgedAt}>{fechaHoraBolivia(alerta.acknowledgedAt)}</time></>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
        {enlace && (
          <Button asChild variant="outline" size="sm">
            <Link to={enlace.href}>{enlace.etiqueta}</Link>
          </Button>
        )}
        {abierta && (
          <Button size="sm" onClick={() => onAtender(alerta.id)} disabled={atendiendo} aria-label={`Marcar atendida: ${titulo}`}>
            <CheckCheck aria-hidden />
            {atendiendo ? "Marcando…" : "Marcar atendida"}
          </Button>
        )}
      </div>
    </li>
  );
}
