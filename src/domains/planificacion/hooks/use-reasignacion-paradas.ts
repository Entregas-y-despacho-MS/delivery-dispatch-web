import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseApiError } from "@/shared/lib/api-error";
import { listarDestinosReasignacion, reasignarParadas } from "../services/reasignacion.service";

export const reasignacionKeys = {
  targets: (id: number) => ["route-batches", id, "reassignment-targets"] as const,
};

export function useDestinosReasignacion(id: number | null, abierto: boolean) {
  return useQuery({
    queryKey: reasignacionKeys.targets(id ?? 0),
    queryFn: ({ signal }) => listarDestinosReasignacion(id as number, signal),
    enabled: abierto && id !== null,
    staleTime: 0,
  });
}

export function useReasignarParadas() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof reasignarParadas>[1] }) => reasignarParadas(id, payload),
    onSuccess: async (_data, variables) => {
      toast.success("Paradas reasignadas");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["route-batches"] }),
        client.invalidateQueries({ queryKey: ["fleet-live-positions"] }),
        client.invalidateQueries({ queryKey: reasignacionKeys.targets(variables.id) }),
      ]);
    },
    onError: async (error: unknown, variables) => {
      const parsed = parseApiError(error);
      if (parsed.status === 409) {
        toast.error("El lote cambió o ya no tiene capacidad. Recarga la información y vuelve a seleccionar las paradas.");
        await client.invalidateQueries({ queryKey: ["route-batches"] });
        await client.invalidateQueries({ queryKey: reasignacionKeys.targets(variables.id) });
      } else toast.error(parsed.message);
    },
  });
}
