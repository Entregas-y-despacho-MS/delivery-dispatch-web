import { useState } from "react";
import { toast } from "sonner";

import type { NivelServicioFormValues } from "../catalogos.schemas";
import type { NivelServicio } from "../catalogos.types";

const INITIAL_NIVELES: NivelServicio[] = [
  {
    id: 1,
    name: "Express",
    description: "Entrega prioritaria para pedidos urgentes.",
    targetTimeMinutes: 120,
    priority: "high",
    active: true,
  },
  {
    id: 2,
    name: "Estándar",
    description: "Ventana regular para la operación diaria.",
    targetTimeMinutes: 360,
    priority: "medium",
    active: true,
  },
  {
    id: 3,
    name: "Mismo día",
    description: "Entrega durante la jornada operativa actual.",
    targetTimeMinutes: 720,
    priority: "low",
    active: false,
  },
];

/**
 * Estado local para revisar el diseño antes de conectar ST-23.1.
 * Este límite permite reemplazar la implementación por useCrud sin cambiar
 * los componentes de la pantalla.
 */
export function useNivelesServicio() {
  const [data, setData] = useState<NivelServicio[]>(INITIAL_NIVELES);
  const [isSaving, setIsSaving] = useState(false);

  const saveItem = async (input: NivelServicioFormValues, id?: number) => {
    setIsSaving(true);
    await Promise.resolve();

    setData((current) => {
      if (id === undefined) {
        return [...current, { ...input, id: Date.now(), active: true }];
      }

      return current.map((item) => (item.id === id ? { ...item, ...input } : item));
    });
    setIsSaving(false);
    toast.success(id === undefined ? "Nivel de servicio creado" : "Nivel de servicio actualizado");
  };

  const toggleActive = (item: NivelServicio) => {
    setData((current) => current.map((entry) => (
      entry.id === item.id ? { ...entry, active: !entry.active } : entry
    )));
    toast.success(item.active ? "Nivel de servicio desactivado" : "Nivel de servicio activado");
  };

  return { data, isLoading: false, isSaving, saveItem, toggleActive };
}
