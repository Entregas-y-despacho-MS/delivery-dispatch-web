import type { ColumnaKanban, ColumnaKanbanKey } from "./despachos.types";

export const COLUMNAS_OPERATIVAS: readonly { key: ColumnaKanbanKey; label: string }[] = [
  { key: "pending", label: "Pendiente" },
  { key: "in_planning", label: "En planificación" },
  { key: "scheduled", label: "Programado" },
  { key: "assigned", label: "Asignado" },
  { key: "out_for_delivery", label: "En ruta" },
  { key: "in_transit", label: "En camino" },
  { key: "delivered", label: "Entregado" },
  { key: "incident", label: "Incidencia" },
  { key: "rescheduled", label: "Reprogramado" },
];

export const COLUMNAS_INVERSA: readonly { key: ColumnaKanbanKey; label: string }[] = [
  { key: "pickup_scheduled", label: "Recojo programado" },
  { key: "picked_up_in_transit", label: "Recojo en camino" },
  { key: "returned_to_warehouse", label: "Devuelto al almacén" },
  { key: "returned", label: "Devuelto" },
];

const ESTADOS_ARRASTRABLES = new Set(["pending", "in_planning"]);
const DESTINOS_REVISION = new Set<ColumnaKanbanKey>(["scheduled", "assigned"]);

export function ordenarColumnas(columnas: ColumnaKanban[], logisticaInversa: boolean): ColumnaKanban[] {
  const definiciones = logisticaInversa ? COLUMNAS_INVERSA : COLUMNAS_OPERATIVAS;
  const porClave = new Map(columnas.map((columna) => [columna.key, columna]));
  return definiciones.map(({ key, label }) => porClave.get(key) ?? {
    key,
    statuses: [key],
    label,
    ordersCount: 0,
    volumeM3: 0,
    dispatches: [],
  });
}

export function puedeArrastrarDespacho(status: string, routeBatchId: number | null): boolean {
  return ESTADOS_ARRASTRABLES.has(status) && routeBatchId !== null;
}

export function destinoAbreRevision(key: ColumnaKanbanKey): boolean {
  return DESTINOS_REVISION.has(key);
}
