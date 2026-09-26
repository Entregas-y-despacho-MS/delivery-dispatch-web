import type { AxiosRequestConfig } from "axios";
import api from "./axios";

export type QueryParamValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryParamValue>;

export interface ListResult<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
  pages?: number;
}

export interface CrudService<TItem, TCreate, TUpdate, TListParams extends QueryParams = QueryParams> {
  list: (params?: TListParams) => Promise<ListResult<TItem>>;
  getOne: (id: string | number) => Promise<TItem>;
  create: (payload: TCreate) => Promise<TItem>;
  update: (id: string | number, payload: TUpdate) => Promise<TItem>;
  delete: (id: string | number) => Promise<void>;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: { page: number; limit: number; pages: number; total: number };
}

export interface CreateCrudServiceOptions<TApiItem, TItem, TListResponse> {
  endpoint: string;
  mapItem?: (item: TApiItem) => TItem;
  mapListResponse?: (response: TListResponse) => ListResult<TItem>;
  updateMethod?: "patch" | "put";
  requestConfig?: AxiosRequestConfig;
}

/**
 * Crea un servicio CRUD tipado sobre el cliente HTTP compartido.
 * Separa la respuesta de API, el modelo de interfaz y los payloads de creación
 * y edición. Las respuestas paginadas se adaptan mediante mapListResponse.
 */
export function createCrudService<
  TApiItem,
  TItem = TApiItem,
  TCreate = Partial<TItem>,
  TUpdate = Partial<TItem>,
  TListParams extends QueryParams = QueryParams,
  TListResponse = TApiItem[],
>({
  endpoint,
  mapItem = (item) => item as unknown as TItem,
  mapListResponse,
  updateMethod = "patch",
  requestConfig,
}: CreateCrudServiceOptions<TApiItem, TItem, TListResponse>): CrudService<TItem, TCreate, TUpdate, TListParams> {
  const mapList = (response: TListResponse): ListResult<TItem> => {
    if (mapListResponse) return mapListResponse(response);

    if (Array.isArray(response)) {
      const items = response.map(mapItem);
      return { items, total: items.length };
    }

    throw new Error("El servicio CRUD necesita mapListResponse para respuestas paginadas.");
  };

  return {
    list: async (params) => {
      const { data } = await api.get<TListResponse>(endpoint, { ...requestConfig, params });
      return mapList(data);
    },
    getOne: async (id) => {
      const { data } = await api.get<TApiItem>(`${endpoint}/${id}`, requestConfig);
      return mapItem(data);
    },
    create: async (payload) => {
      const { data } = await api.post<TApiItem>(endpoint, payload, requestConfig);
      return mapItem(data);
    },
    update: async (id, payload) => {
      const { data } = updateMethod === "put"
        ? await api.put<TApiItem>(`${endpoint}/${id}`, payload, requestConfig)
        : await api.patch<TApiItem>(`${endpoint}/${id}`, payload, requestConfig);
      return mapItem(data);
    },
    delete: async (id) => {
      await api.delete(`${endpoint}/${id}`, requestConfig);
    },
  };
}
