/** Tiempos compartidos; las mutaciones invalidan las listas afectadas. */
export const QUERY_POLICIES = {
  operational: {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  },
  catalog: {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  },
  // Para futuras vistas en vivo: no inicia sondeos por sí misma.
  live: {
    staleTime: 0,
    refetchOnWindowFocus: true,
  },
} as const;

export type QueryPolicy = keyof typeof QUERY_POLICIES;
