import api from "@/shared/lib/axios";
import type { CumplimientoProveedores, ParamsProveedores } from "../reportes.proveedores";

/** Cumplimiento de citas de recojo a proveedores (ST-305.1). Solo coordinador o root; sin caché. */
export async function obtenerCumplimientoProveedores(params: ParamsProveedores, signal?: AbortSignal): Promise<CumplimientoProveedores> {
  const { data } = await api.get<CumplimientoProveedores>("/reports/supplier-pickups", { params, signal, skipErrorToast: true });
  return data;
}

/** Almacenes activos para el filtro de destino. */
export async function listarAlmacenesReporte(signal?: AbortSignal): Promise<{ id: number; nombre: string }[]> {
  const { data } = await api.get<{ data: { id: number; name: string }[] }>("/warehouses", { params: { active: true, limit: 100 }, signal, skipErrorToast: true });
  return data.data.map(({ id, name }) => ({ id, nombre: name }));
}
