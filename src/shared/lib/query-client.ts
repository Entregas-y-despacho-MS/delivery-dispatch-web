import { QueryClient } from "@tanstack/react-query";
import { parseApiError } from "./api-error";

/** La misma caché para los providers y para el cierre de sesión fuera de React. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => failureCount < 2 && parseApiError(error).retryable,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});
