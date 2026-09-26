import api from "@/shared/lib/axios";
import { ROLE_BY_BACKEND_NAME, ROLE_LABELS } from "@/config/roles";
import type { BackendPage, BackendRole, Rol } from "../usuarios.types";

/** Adapta el rol del backend al modelo del front. Si el rol no está en config/roles, se muestra su nombre. */
export function toRol(r: BackendRole): Rol {
  const idFront = ROLE_BY_BACKEND_NAME[r.name];
  return { id: r.id, nombre: r.name, etiqueta: idFront !== undefined ? ROLE_LABELS[idFront] : r.name };
}

export const rolesService = {
  list: async (): Promise<Rol[]> => {
    // skipErrorToast: el selector avisa por su cuenta si no se pudieron cargar los roles.
    const { data } = await api.get<BackendPage<BackendRole>>("/roles", {
      params: { page: 1, limit: 100 },
      skipErrorToast: true,
    });
    return data.data.map(toRol);
  },
};
