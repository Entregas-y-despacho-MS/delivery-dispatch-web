import { CarFront, Plus } from "lucide-react";
import { useState } from "react";

import {
  TipoIncidenteVehiculoForm,
  TiposIncidenteVehiculoTable,
  type TipoIncidenteVehiculo,
} from "@/domains/catalogos";
import { PageHeader } from "@/shared/components/common/page-header";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export default function TiposIncidenteVehiculoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoIncidenteVehiculo>();
  const [formDirty, setFormDirty] = useState(false);

  const closeDialog = (open: boolean) => {
    if (!open && formDirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
    setDialogOpen(open);
    if (!open) {
      setEditingTipo(undefined);
      setFormDirty(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogos · Flota"
        title="Fallas mecánicas"
        icon={CarFront}
        description="Clasifica los incidentes de vehículos por severidad y define cuáles bloquean la unidad."
        action={<Button onClick={() => setDialogOpen(true)}><Plus aria-hidden /> Ver formulario</Button>}
      />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5"
        aria-label="Catálogo de fallas mecánicas">
        <div className="space-y-1 border-b pb-4">
          <h2 className="font-semibold">Tipos de falla</h2>
          <p className="text-sm text-muted-foreground">Severidad y bloqueo operativo de cada tipo de incidente.</p>
        </div>

        <TiposIncidenteVehiculoTable data={[]} unavailable onEdit={(tipo) => {
          setEditingTipo(tipo);
          setDialogOpen(true);
        }} />
      </section>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTipo ? "Editar tipo de falla" : "Nuevo tipo de falla"}</DialogTitle>
            <DialogDescription>
              Define la severidad y si esta falla impide asignar nuevos despachos al vehículo.
            </DialogDescription>
          </DialogHeader>
          <TipoIncidenteVehiculoForm key={editingTipo?.id ?? "new"} tipo={editingTipo}
            onCancel={() => closeDialog(false)} onDirtyChange={setFormDirty} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
