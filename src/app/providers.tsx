import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/shared/lib/theme-provider";
import { ErrorBoundary } from "@/shared/components/feedback/error-boundary";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Reintento automático inteligente ante fallas de conexión o HTTP 5xx
            retry: (failureCount, error) => {
              if (isAxiosError(error) && error.response?.status) {
                const status = error.response.status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
