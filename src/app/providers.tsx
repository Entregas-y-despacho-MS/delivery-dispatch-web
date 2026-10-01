import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Check, CircleAlert, Loader2, TriangleAlert, Truck, X } from "lucide-react";
import { ThemeProvider } from "@/shared/lib/theme-provider";
import { ErrorBoundary } from "@/shared/components/feedback/error-boundary";
import { queryClient } from "@/shared/lib/query-client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-right"
            closeButton
            icons={{
              success: <Check className="size-5 stroke-[2.5]" />,
              info: <Truck className="size-5 stroke-[2]" />,
              warning: <TriangleAlert className="size-5 stroke-[2]" />,
              error: <CircleAlert className="size-5 stroke-[2]" />,
              loading: <Loader2 className="size-5 animate-spin" />,
              close: <X className="size-4 stroke-[2]" />,
            }}
            toastOptions={{
              classNames: {
                toast: "font-sans group",
                title: "font-semibold text-sm text-foreground tracking-tight",
                description: "text-xs text-muted-foreground mt-0.5",
                actionButton: "bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors",
                cancelButton: "bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors",
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
