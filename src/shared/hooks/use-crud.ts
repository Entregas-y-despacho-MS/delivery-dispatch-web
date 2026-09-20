import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CrudService } from "@/shared/lib/base.service";
import { createQueryKeys } from "@/shared/lib/query-keys";

/**
 * Una pantalla CRUD completa sin useState / useEffect / try-catch:
 *
 *   const { data, loading, createItem } = useCrud(clientesService, "clientes");
 */
export const useCrud = <T>(
  service: CrudService<T>,
  scope: string,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  const queryClient = useQueryClient();
  const keys = createQueryKeys(scope);

  const { data = [], isLoading: loading, isError: error, refetch } = useQuery<T[]>({
    queryKey: keys.lists(),
    queryFn: () => service.getAll(),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.all });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<T>) => service.create(payload),
    onSuccess: () => { invalidate(); toast.success("Registro creado exitosamente"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<T> }) =>
      service.update(id, data),
    onSuccess: () => { invalidate(); toast.success("Registro actualizado exitosamente"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => service.delete(id),
    onSuccess: () => { invalidate(); toast.success("Registro eliminado exitosamente"); },
  });

  return {
    data, loading, error, refetch, keys,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};

/** Detalle de un registro, con la misma convención de keys. */
export const useCrudItem = <T>(service: CrudService<T>, scope: string, id?: string | number) => {
  const keys = createQueryKeys(scope);
  return useQuery<T>({
    queryKey: keys.detail(id ?? ""),
    queryFn: () => service.getOne(id!),
    enabled: id !== undefined,
  });
};
