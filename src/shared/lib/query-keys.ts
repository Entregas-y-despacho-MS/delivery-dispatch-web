import type { QueryParams } from "./base.service";

/** Convención única para listas, detalles e invalidación de recursos. */
export const createQueryKeys = <TParams extends QueryParams = QueryParams>(scope: string) => ({
  all: [scope] as const,
  lists: (params?: TParams) => [scope, "list", params ?? {}] as const,
  detail: (id: string | number) => [scope, "detail", id] as const,
});

export type QueryKeys<TParams extends QueryParams = QueryParams> = ReturnType<typeof createQueryKeys<TParams>>;
