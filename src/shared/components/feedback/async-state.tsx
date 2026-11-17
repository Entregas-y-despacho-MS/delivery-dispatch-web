import type { ReactNode } from "react";

import { ErrorAlert } from "@/shared/components/feedback/error-alert";

interface AsyncStateProps {
  loading: boolean;
  error?: unknown;
  empty: boolean;
  loadingFallback: ReactNode;
  emptyFallback: ReactNode;
  onRetry?: () => void | Promise<unknown>;
  children: ReactNode;
}

/** Orden único para recursos sin DataTable: carga, error, vacío y contenido. */
export function AsyncState({
  loading,
  error,
  empty,
  loadingFallback,
  emptyFallback,
  onRetry,
  children,
}: AsyncStateProps) {
  if (loading) return <>{loadingFallback}</>;
  if (error != null) return <ErrorAlert error={error} onRetry={onRetry} />;
  if (empty) return <>{emptyFallback}</>;
  return <>{children}</>;
}
