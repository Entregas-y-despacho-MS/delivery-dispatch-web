/**
 * Evita el bug clásico de invalidar "cliente" cuando la query se llamó
 * "clientes" y la tabla nunca se refresca.
 */
export const createQueryKeys = (scope: string) => ({
  all: [scope] as const,
  lists: () => [scope, "list"] as const,
  detail: (id: string | number) => [scope, "detail", id] as const,
});

export type QueryKeys = ReturnType<typeof createQueryKeys>;
