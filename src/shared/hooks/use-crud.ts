import { useMutation, useQuery, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CrudService, ListResult, QueryParams } from "@/shared/lib/base.service";
import { createQueryKeys } from "@/shared/lib/query-keys";

export interface CrudNotifications {
  created?: string;
  updated?: string;
  deleted?: string;
}

export interface UseCrudOptions<TParams extends QueryParams, TItem> {
  params?: TParams;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
  notifications?: CrudNotifications;
  onCreated?: (item: TItem) => void;
  onUpdated?: (item: TItem) => void;
  onDeleted?: (id: string | number) => void;
}

/**
 * CRUD estándar para recursos con lista, detalle y mutaciones.
 * La caché usa los filtros como parte de la query key y las notificaciones son
 * opt-in para que los dominios puedan mostrar errores o resultados inline.
 */
export function useCrud<TItem, TCreate, TUpdate, TParams extends QueryParams = QueryParams>(
  service: CrudService<TItem, TCreate, TUpdate, TParams>,
  scope: string,
  options: UseCrudOptions<TParams, TItem> = {},
) {
  const queryClient = useQueryClient();
  const keys = createQueryKeys<TParams>(scope);
  const result = useQuery<ListResult<TItem>>({
    queryKey: keys.lists(options.params),
    queryFn: () => service.list(options.params),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    refetchInterval: options.refetchInterval,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.all });
  const notify = (message?: string) => { if (message) toast.success(message); };

  const createMutation = useMutation({
    mutationFn: (payload: TCreate) => service.create(payload),
    onSuccess: async (item) => {
      await invalidate();
      notify(options.notifications?.created);
      options.onCreated?.(item);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: TUpdate }) => service.update(id, data),
    onSuccess: async (item) => {
      await invalidate();
      notify(options.notifications?.updated);
      options.onUpdated?.(item);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => service.delete(id),
    onSuccess: async (_, id) => {
      await invalidate();
      notify(options.notifications?.deleted);
      options.onDeleted?.(id);
    },
  });

  return {
    ...result,
    data: result.data?.items ?? [],
    result: result.data,
    total: result.data?.total ?? 0,
    page: result.data?.page,
    pageSize: result.data?.pageSize,
    pages: result.data?.pages,
    keys,
    createMutation,
    updateMutation,
    deleteMutation,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

export function useCrudItem<TItem, TCreate, TUpdate, TParams extends QueryParams = QueryParams>(
  service: CrudService<TItem, TCreate, TUpdate, TParams>,
  scope: string,
  id?: string | number,
) {
  const keys = createQueryKeys<TParams>(scope);
  return useQuery<TItem>({
    queryKey: keys.detail(id ?? ""),
    queryFn: () => service.getOne(id!),
    enabled: id !== undefined,
  });
}

export type CrudMutation<TVariables, TData> = UseMutationResult<TData, Error, TVariables, unknown>;
