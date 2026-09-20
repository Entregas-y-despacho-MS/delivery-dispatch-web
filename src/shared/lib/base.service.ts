import api from "./axios";

export interface CrudService<T> {
  getAll: () => Promise<T[]>;
  getOne: (id: string | number) => Promise<T>;
  create: (payload: Partial<T>) => Promise<T>;
  update: (id: string | number, payload: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
}

/**
 * Genera los 5 métodos CRUD de un endpoint.
 *
 *   export const clientesService = {
 *     ...createCrudService<Cliente>("/clientes"),
 *     activar: (id: number) => api.post(`/clientes/${id}/activar`),
 *   };
 */
export const createCrudService = <T>(endpoint: string): CrudService<T> => ({
  getAll: async () => (await api.get<T[]>(endpoint)).data,
  getOne: async (id) => (await api.get<T>(`${endpoint}/${id}`)).data,
  create: async (payload) => (await api.post<T>(endpoint, payload)).data,
  update: async (id, payload) => (await api.patch<T>(`${endpoint}/${id}`, payload)).data,
  delete: async (id) => { await api.delete(`${endpoint}/${id}`); },
});
