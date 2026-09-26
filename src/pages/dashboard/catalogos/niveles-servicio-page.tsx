import { useMemo, useState, type ComponentProps } from "react";
import { Gauge, ListFilter, Plus, Search } from "lucide-react";

import {
  NivelServicioForm,
  NivelesServicioTable,
  useNivelesServicio,
  type NivelServicio,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export default function NivelesServicioPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNivel, setEditingNivel] = useState<NivelServicio>();
  const [nivelToDeactivate, setNivelToDeactivate] = useState<NivelServicio>();
  const niveles = useNivelesServicio();

  const filteredNiveles = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return niveles.data.filter((nivel) => {
      const matchesSearch = !normalizedSearch
        || nivel.name.toLocaleLowerCase().includes(normalizedSearch)
        || nivel.description.toLocaleLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" ? nivel.active : !nivel.active);

      return matchesSearch && matchesStatus;
    });
  }, [niveles.data, search, statusFilter]);

  const activeCount = niveles.data.filter((nivel) => nivel.active).length;
  const hasFilters = search.trim().length > 0 || statusFilter !== "all";

  const openCreate = () => {
    setEditingNivel(undefined);
    setDialogOpen(true);
  };

  const openEdit = (nivel: NivelServicio) => {
    setEditingNivel(nivel);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingNivel(undefined);
  };

  const saveNivel: ComponentProps<typeof NivelServicioForm>["onSubmit"] = async (values) => {
    await niveles.saveItem(values, editingNivel?.id);
    closeDialog(false);
  };

  const requestToggle = (nivel: NivelServicio) => {
    if (nivel.active) {
      setNivelToDeactivate(nivel);
      return;
    }
    niveles.toggleActive(nivel);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos"
        title="Niveles de servicio"
        icon={Gauge}
        description="Define los compromisos de entrega que orientan la prioridad de cada despacho."
        action={(
          <Button onClick={openCreate}>
            <Plus aria-hidden /> Nuevo nivel
          </Button>
        )}
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Catálogo de niveles de servicio">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ListFilter className="size-4 text-primary" aria-hidden />
              <h2 className="font-semibold">Catálogo operativo</h2>
              <Badge variant="secondary">{activeCount} activos</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {niveles.data.length} {niveles.data.length === 1 ? "nivel configurado" : "niveles configurados"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative w-full sm:min-w-64 lg:w-72">
              <label htmlFor="niveles-servicio-search" className="sr-only">Buscar niveles de servicio</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="niveles-servicio-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Express o entrega prioritaria"
                className="h-10 pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
              <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <NivelesServicioTable
            data={filteredNiveles}
            loading={niveles.isLoading}
            searchActive={hasFilters}
            onEdit={openEdit}
            onToggle={requestToggle}
          />
        </div>

        {hasFilters && filteredNiveles.length === 0 && (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNivel ? "Editar nivel de servicio" : "Nuevo nivel de servicio"}</DialogTitle>
            <DialogDescription>
              {editingNivel
                ? "Actualiza el compromiso de entrega y la prioridad operativa."
                : "Configura un compromiso de entrega para asociarlo a las órdenes."}
            </DialogDescription>
          </DialogHeader>
          <NivelServicioForm
            key={editingNivel?.id ?? "new"}
            nivel={editingNivel}
            onSubmit={saveNivel}
            onCancel={() => closeDialog(false)}
            guardando={niveles.isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!nivelToDeactivate} onOpenChange={(open) => { if (!open) setNivelToDeactivate(undefined); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar nivel de servicio</DialogTitle>
            <DialogDescription>
              {nivelToDeactivate
                ? `El nivel ${nivelToDeactivate.name} no estará disponible para nuevas órdenes.`
                : "El nivel dejará de estar disponible para nuevas órdenes."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setNivelToDeactivate(undefined)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (nivelToDeactivate) niveles.toggleActive(nivelToDeactivate);
                setNivelToDeactivate(undefined);
              }}
            >
              Desactivar nivel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
