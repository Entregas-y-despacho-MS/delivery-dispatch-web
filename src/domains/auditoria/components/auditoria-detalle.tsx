import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { etiquetaAccion, etiquetaEntidad, etiquetaRol, formatearHoraAuditoria } from "../auditoria.reglas";
import type { EventoAuditoria } from "../types/auditoria.types";
import { ResultadoAuditoriaBadge } from "./auditoria-tabla";

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
      <dd className="text-sm break-all">{children}</dd>
    </div>
  );
}

interface AuditoriaDetalleProps {
  evento: EventoAuditoria | null;
  onCerrar: () => void;
}

/**
 * Detalle de un evento (ST-70.2). Muestra solo lo que el back mandó para el rol: la IP y los campos
 * declarados del body llegan únicamente a root, así que para el administrador no aparecen.
 */
export function AuditoriaDetalle({ evento, onCerrar }: AuditoriaDetalleProps) {
  const metadata = evento?.metadata ? Object.entries(evento.metadata) : [];
  return (
    <Sheet open={!!evento} onOpenChange={(abierto) => { if (!abierto) onCerrar(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {evento && (
          <>
            <SheetHeader>
              <SheetTitle>{etiquetaAccion(evento.action)}</SheetTitle>
              <SheetDescription>{formatearHoraAuditoria(evento.occurredAt)}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-4 px-4 pb-6">
              <Dato titulo="Resultado">
                <span className="inline-flex items-center gap-2">
                  <ResultadoAuditoriaBadge resultado={evento.result} />
                  {evento.statusCode !== null && <span className="text-muted-foreground">HTTP {evento.statusCode}</span>}
                </span>
              </Dato>
              <Dato titulo="Actor">{evento.actorId === null ? "Sin sesión" : `Usuario #${evento.actorId}`} · {etiquetaRol(evento.actorRole)}</Dato>
              <Dato titulo="Objeto">{etiquetaEntidad(evento.entityType)}{evento.entityId ? ` #${evento.entityId}` : " (sin ID)"}</Dato>
              <Dato titulo="Código de acción"><span className="font-mono text-xs">{evento.action}</span></Dato>
              <Dato titulo="Correlación (X-Request-Id)"><span className="font-mono text-xs">{evento.correlationId}</span></Dato>
              <Dato titulo="ID del evento"><span className="font-mono text-xs">{evento.eventId}</span></Dato>
              {evento.ip != null && <Dato titulo="IP del cliente"><span className="font-mono text-xs">{evento.ip}</span></Dato>}
              {metadata.length > 0 && (
                <Dato titulo="Datos registrados">
                  <ul className="space-y-0.5">
                    {metadata.map(([clave, valor]) => (
                      <li key={clave}><span className="font-mono text-xs">{clave}</span>: {String(valor)}</li>
                    ))}
                  </ul>
                </Dato>
              )}
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
