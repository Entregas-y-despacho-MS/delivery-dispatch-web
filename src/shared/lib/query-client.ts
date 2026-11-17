import { QueryClient } from "@tanstack/react-query";
import { parseApiError } from "./api-error";
import { QUERY_POLICIES } from "./query-policies";

/** La misma caché para los providers y para el cierre de sesión fuera de React. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...QUERY_POLICIES.operational,
      retry: (failureCount, error) => failureCount < 2 && parseApiError(error).retryable,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});
