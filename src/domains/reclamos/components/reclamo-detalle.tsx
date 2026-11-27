import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, Hand, Search, ShieldCheck } from "lucide-react";

import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";
import { parseApiError } from "@/shared/lib/api-error";
import { useReclamo } from "../hooks/use-reclamos";
import {
  borradorVacio,
  etiquetaDictamen,
  formatearFechaReclamo,
  mensajeErrorReclamos,
  type BorradorDictamen,
} from "../reclamos.reglas";
import type { ReclamoDetalle as Caso } from "../types/reclamos.types";
import { DictamenForm } from "./dictamen-form";
import { EstadoReclamoBadge } from "./reclamos-tabla";

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t pt-4" aria-label={titulo}>
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {children}
    </section>
  );
}

/** Cronología del caso: solo los hitos que ya ocurrieron. */
function Cronologia({ caso }: { caso: Caso }) {
  const hitos = [
    { titulo: "Abierto en el CRM", fecha: caso.openedAt, quien: null },
    { titulo: "Recibido por Despacho", fecha: caso.receivedAt, quien: null },
    { titulo: "Caso tomado", fecha: caso.assignedAt, quien: caso.assignedUserName },
    { titulo: "Investigación iniciada", fecha: caso.investigationStartedAt, quien: null },
    { titulo: `Dictamen: ${etiquetaDictamen(caso.verdict)}`, fecha: caso.decidedAt, quien: caso.decidedByUserName },
  ].filter((hito) => hito.fecha);
  return (
    <ol className="space-y-2" aria-label="Cronología">
      {hitos.map((hito) => (
        <li key={hito.titulo} className="flex gap-3 text-sm">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
          <div>
            <p className="font-medium">{hito.titulo}</p>
            <p className="text-xs text-muted-foreground">{formatearFechaReclamo(hito.fecha)}{hito.quien ? ` · ${hito.quien}` : ""}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const ACUSES = {
  tomar: "Tomaste el caso.",
  iniciar: "La investigación empezó.",
  dictaminar: "Dictamen registrado.",
} as const;

interface ReclamoDetalleProps {
  id: number | null;
  /** ID del usuario en sesión: para saber si el caso ya es suyo. */
  miId: number | null;
  onCerrar: () => void;
}

/**
 * Detalle interno del reclamo (ST-45.3): cronología, despacho, evidencia protegida y las acciones según la
 * siguiente acción del back. No hay acción para aprobar el RMA ni para cerrar el caso del CRM.
 */
export function ReclamoDetalle({ id, miId, onCerrar }: ReclamoDetalleProps) {
  return (
    <Sheet open={id !== null} onOpenChange={(abierto) => { if (!abierto) onCerrar(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {id !== null && <Contenido key={id} id={id} miId={miId} />}
      </SheetContent>
    </Sheet>
  );
}

function Contenido({ id, miId }: { id: number; miId: number | null }) {
  const { detalle, tomar, iniciar, dictaminar } = useReclamo(id);
  const [borrador, setBorrador] = useState<BorradorDictamen>(borradorVacio);
  const [acuse, setAcuse] = useState<string | null>(null);

  if (detalle.isPending) {
    return (
      <div className="space-y-3 p-4" aria-busy="true">
        <SheetTitle className="sr-only">Cargando reclamo</SheetTitle>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (detalle.isError) {
    return (
      <div className="p-4">
        <SheetTitle className="sr-only">Reclamo no disponible</SheetTitle>
        <ErrorAlert title="No pudimos abrir el reclamo" error={detalle.error}
          description={mensajeErrorReclamos(parseApiError(detalle.error))}
          onRetry={() => detalle.refetch()} isRetrying={detalle.isFetching} />
      </div>
    );
  }

  const caso = detalle.data;
  const ocupado = tomar.isPending || iniciar.isPending || dictaminar.isPending;
  const errorComando = tomar.error ?? iniciar.error ?? dictaminar.error;
  const resetear = () => {
    tomar.reset();
    iniciar.reset();
    dictaminar.reset();
    setAcuse(null);
  };
  const esMio = miId !== null && caso.assignedUserId === miId;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-mono">{caso.crmCaseId}</SheetTitle>
        <SheetDescription>Reclamo #{caso.complaintId} · motivo {caso.reasonCode} · versión {caso.caseVersion}</SheetDescription>
        <div><EstadoReclamoBadge reclamo={caso} /></div>
      </SheetHeader>

      <div className="space-y-4 px-4 pb-6">
        {acuse && (
          <p role="status" className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden /> {acuse}
          </p>
        )}
        {errorComando ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {mensajeErrorReclamos(parseApiError(errorComando))}
          </p>
        ) : null}

        {!caso.eligible && caso.investigationStatus !== "decided" && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            El despacho no está entregado: el caso se puede leer, pero no investigar.
          </p>
        )}

        {caso.nextAction === "assign" && (
          <Button type="button" disabled={ocupado} onClick={() => { resetear(); tomar.mutate(undefined, { onSuccess: () => setAcuse(ACUSES.tomar) }); }}>
            <Hand aria-hidden /> {tomar.isPending ? "Tomando..." : "Tomar el caso"}
          </Button>
        )}
        {caso.nextAction === "start_investigation" && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={ocupado} onClick={() => { resetear(); iniciar.mutate(undefined, { onSuccess: () => setAcuse(ACUSES.iniciar) }); }}>
              <Search aria-hidden /> {iniciar.isPending ? "Iniciando..." : "Iniciar investigación"}
            </Button>
            {!esMio && (
              <Button type="button" variant="outline" disabled={ocupado} onClick={() => { resetear(); tomar.mutate(undefined, { onSuccess: () => setAcuse(ACUSES.tomar) }); }}>
                <Hand aria-hidden /> Tomar el caso yo
              </Button>
            )}
          </div>
        )}
        {caso.nextAction === "issue_verdict" && (
          <DictamenForm
            borrador={borrador}
            onCambiar={setBorrador}
            items={caso.affectedItems}
            enviando={dictaminar.isPending}
            onEmitir={(dictamen) => {
              resetear();
              dictaminar.mutate(dictamen, { onSuccess: () => { setAcuse(ACUSES.dictaminar); setBorrador(borradorVacio()); } });
            }}
          />
        )}
        {caso.nextAction === "await_inventory_authorization" && (
          <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
            Solicitud de RMA enviada a Inventarios: autorización pendiente. Desde aquí no se aprueba el RMA ni se cierra el caso del CRM.
          </p>
        )}

        <Seccion titulo="Despacho">
          <dl className="grid grid-cols-2 gap-3">
            <Dato titulo="Seguimiento">{caso.trackingCode ?? "Sin código"}</Dato>
            <Dato titulo="Estado del despacho">{caso.dispatchStatus}</Dato>
            <Dato titulo="Zona">{caso.zoneName ?? "—"}</Dato>
            <Dato titulo="Lote de ruta">{caso.routeBatchId ? `#${caso.routeBatchId} (${caso.routeBatchStatus ?? "—"})` : "—"}</Dato>
          </dl>
          <Button asChild variant="link" size="sm" className="px-0">
            <Link to={`/app/despachos/${caso.dispatchId}`}><ExternalLink aria-hidden /> Ver despacho #{caso.dispatchId}</Link>
          </Button>
        </Seccion>

        <Seccion titulo="Cronología">
          <Cronologia caso={caso} />
        </Seccion>

        <Seccion titulo="Ítems afectados">
          {caso.affectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">El CRM no indicó ítems.</p>
          ) : (
            <ul className="space-y-1">
              {caso.affectedItems.map((item) => (
                <li key={`${item.packageId}-${item.itemCode}`} className="flex justify-between gap-2 font-mono text-xs">
                  <span>{item.itemCode} · paquete {item.packageId}</span>
                  <span>{item.quantity} u.</span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Evidencia">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            La evidencia queda protegida en el CRM: aquí no se muestran archivos, enlaces ni datos del cliente.
          </p>
        </Seccion>

        {(caso.findings || caso.decisionReason || caso.authorizationRequestId) && (
          <Seccion titulo="Resultado">
            <dl className="grid gap-3">
              <Dato titulo="Dictamen">{etiquetaDictamen(caso.verdict)}</Dato>
              {caso.decisionReason && <Dato titulo="Motivo">{caso.decisionReason}</Dato>}
              {caso.findings && <Dato titulo="Hallazgos"><span className="whitespace-pre-line">{caso.findings}</span></Dato>}
              {caso.authorizationRequestId && <Dato titulo="Solicitud a Inventarios"><span className="font-mono text-xs">{caso.authorizationRequestId}</span></Dato>}
              {caso.verdict === "request_RMA" && <Dato titulo="RMA">{caso.rmaId ?? "Pendiente de autorización"}</Dato>}
            </dl>
          </Seccion>
        )}
      </div>
    </>
  );
}
