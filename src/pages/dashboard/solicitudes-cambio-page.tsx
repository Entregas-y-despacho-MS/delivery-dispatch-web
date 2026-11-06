import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MessageSquareText, RefreshCw, Search, CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { ReprogramarDialog, solicitudesCambioService, type SolicitudCambio } from "@/domains/despachos";
import { RequireRole } from "@/shared/guards/require-role";
import { ROLES } from "@/config/roles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { PageHeader } from "@/shared/components/common/page-header";

function SolicitudCard({ item }: { item: SolicitudCambio }) {
  const [url, setUrl] = useState("");
  const reveal = useMutation({ mutationFn: () => solicitudesCambioService.revealTrackingLink(item.dispatchId), onSuccess: (data) => setUrl(data.trackingUrl), onError: () => toast.error("El enlace ya no está disponible o el permiso cambió. Actualiza la bandeja.") });
  return <article className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="break-all text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.trackingCode || `Despacho #${item.dispatchId}`}</p><h2 className="mt-1 break-words text-lg font-semibold">{item.contactName || "Cliente"}</h2><p className="text-sm text-muted-foreground">{item.zoneName || "Zona sin asignar"}{item.deliveryDate ? ` · ${item.deliveryDate}` : ""}</p></div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.promiseIsFirm ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{item.promiseIsFirm ? "Promesa confirmada" : "Promesa pendiente"}</span>
    </div>
    <div className="mt-4 rounded-lg bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-sm font-medium"><MessageSquareText className="size-4" aria-hidden /> Solicitud del cliente</div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.request.detail || "El cliente pidió un cambio sin agregar comentarios."}</p>
      <p className="mt-2 text-xs text-muted-foreground">Recibida {new Date(item.request.requestedAt).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" })}{item.request.responseWindowWasOpen === true ? " · dentro del plazo de respuesta" : ""}</p>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Estado: {item.status}</span>
      {item.canRevealTrackingLink && <Button size="sm" variant="outline" disabled={reveal.isPending} onClick={() => reveal.mutate()}><ExternalLink aria-hidden /> {reveal.isPending ? "Solicitando…" : "Mostrar enlace de seguimiento"}</Button>}
    </div>
    {url && <div className="mt-3 break-all rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm"><p className="font-medium">Enlace de seguimiento · compártelo solo con el cliente</p><a className="mt-1 block text-primary underline" href={url} target="_blank" rel="noreferrer">{url}</a><Button className="mt-2" size="sm" variant="ghost" onClick={() => setUrl("")}>Ocultar enlace</Button></div>}
  </article>;
}

export default function SolicitudesCambioPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SolicitudCambio | null>(null);
  const query = useQuery({ queryKey: ["dispatch-change-requests", { page, search }], queryFn: ({ signal }) => solicitudesCambioService.list({ page, limit: 20, ...(search.trim() ? { search: search.trim() } : {}) }, signal), staleTime: 10_000 });
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Atención al cliente" title="Solicitudes de cambio" icon={MessageSquareText} description="Revisa las solicitudes que llegaron desde el seguimiento y su promesa de entrega." />
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por código o cliente" aria-label="Buscar solicitudes" /></div>
      <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw aria-hidden /> Actualizar</Button>
    </div>
    {query.isPending ? <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">Cargando solicitudes…</div> : query.isError ? <div role="alert" className="rounded-xl border border-destructive/30 p-6 text-sm">No se pudieron cargar las solicitudes. Verifica tu conexión y vuelve a actualizar.</div> : query.data.items.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><p className="font-medium">No hay solicitudes pendientes</p><p className="mt-1 text-sm text-muted-foreground">Las nuevas solicitudes de los clientes aparecerán aquí.</p></div> : <>
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">{query.data.items.map((item) => <div key={item.dispatchId} className="min-w-0 space-y-2"><SolicitudCard item={item} /><RequireRole roles={[ROLES.COORDINADOR]}><Button className="w-full" disabled={!item.deliveryDate} onClick={() => setSelected(item)}><CalendarClock aria-hidden /> {item.deliveryDate ? "Resolver solicitud" : "Despacho sin fecha de ruta"}</Button></RequireRole></div>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{query.data.total} solicitudes</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => current - 1)}>Anterior</Button><span className="px-2 py-2">Página {page} de {Math.max(1, query.data.pages ?? Math.ceil(query.data.total / (query.data.pageSize ?? 20)))}</span><Button variant="outline" size="sm" disabled={page * (query.data.pageSize ?? 20) >= query.data.total || query.isFetching} onClick={() => setPage((current) => current + 1)}>Siguiente</Button></div></div>
    </>}
    <RequireRole roles={[ROLES.COORDINADOR]}>{selected?.deliveryDate && <ReprogramarDialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }} despachoId={selected.dispatchId} fecha={selected.deliveryDate} onComplete={() => { setSelected(null); void queryClient.invalidateQueries({ queryKey: ["dispatch-change-requests"] }); }} />}</RequireRole>
  </div>;
}
