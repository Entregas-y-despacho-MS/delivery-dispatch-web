import { useState } from "react";
import { RefreshCw, ServerCrash, TriangleAlert, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { parseApiError } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";

export interface ErrorAlertProps {
  /** Error capturado (AxiosError, Error nativo o ApiError normalizado). */
  error?: unknown;
  /** Título personalizado (sobrescribe la detección automática). */
  title?: string;
  /** Mensaje explicativo personalizado. */
  description?: string;
  /** Función disparada para reintentar la operación fallida. */
  onRetry?: () => void | Promise<unknown>;
  /** Estado de carga durante el reintento. */
  isRetrying?: boolean;
  className?: string;
}

type ErrorKind = "network" | "server" | "generic";

interface ErrorClassification {
  kind: ErrorKind;
  title: string;
  description: string;
  badgeLabel: string;
}

function classifyError(error: unknown, fallbackDesc?: string): ErrorClassification {
  const parsed = parseApiError(error);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (parsed.kind === "network") {
    return {
      kind: "network",
      title: "Sin conexión con el servidor",
      description: fallbackDesc ?? parsed.message,
      badgeLabel: isOffline ? "Desconectado" : "Falla de red",
    };
  }

  if (parsed.kind === "server") {
    return {
      kind: "server",
      title: "Error interno del servidor",
      description: fallbackDesc ?? parsed.message,
      badgeLabel: `HTTP ${parsed.status}`,
    };
  }

  return {
    kind: "generic",
    title: "No se pudo completar la operación",
    description: fallbackDesc ?? parsed.message,
    badgeLabel: parsed.status ? `Error ${parsed.status}` : "Error",
  };
}

/**
 * Alerta contextual. TanStack Query controla los reintentos automáticos; aquí solo
 * se ofrece un reintento manual después de que la consulta haya fallado.
 */
export function ErrorAlert({
  error,
  title,
  description,
  onRetry,
  isRetrying = false,
  className,
}: ErrorAlertProps) {
  const classification = classifyError(error, description);
  const finalTitle = title ?? classification.title;
  const finalDescription = classification.description;

  const [isPendingLocal, setIsPendingLocal] = useState(false);
  const activeLoading = isRetrying || isPendingLocal;

  const handleManualRetry = async () => {
    if (!onRetry || activeLoading) return;
    setIsPendingLocal(true);
    try {
      await onRetry();
    } catch {
      // La consulta actualiza su propio estado de error y la alerta permanece visible.
    } finally {
      setIsPendingLocal(false);
    }
  };

  const getIcon = () => {
    switch (classification.kind) {
      case "network":
        return <WifiOff className="size-4.5 shrink-0" aria-hidden />;
      case "server":
        return <ServerCrash className="size-4.5 shrink-0" aria-hidden />;
      case "generic":
      default:
        return <TriangleAlert className="size-4.5 shrink-0" aria-hidden />;
    }
  };

  const getVariant = () => {
    switch (classification.kind) {
      case "network":
        return "warning";
      case "server":
      case "generic":
      default:
        return "destructive";
    }
  };

  return (
    <Alert
      variant={getVariant()}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl shadow-xs border transition-all animate-in fade-in-50",
        className
      )}
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full shadow-xs",
            classification.kind === "network"
              ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
              : "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
          )}
        >
          {getIcon()}
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTitle className="text-sm font-semibold leading-snug">{finalTitle}</AlertTitle>
            <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-mono tracking-tight rounded-md bg-background/60 border-current/20">
              {classification.badgeLabel}
            </Badge>
          </div>
          <AlertDescription className="text-xs sm:text-sm opacity-90 leading-relaxed mt-0.5">
            {finalDescription}
          </AlertDescription>
        </div>
      </div>

      {onRetry && (
        <div className="flex items-center gap-2 sm:self-center shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualRetry}
            disabled={activeLoading}
            className="gap-2 cursor-pointer shadow-xs font-medium rounded-lg bg-background/80 hover:bg-background transition-all"
          >
            <RefreshCw className={cn("size-3.5", activeLoading && "animate-spin")} aria-hidden />
            {activeLoading ? "Reintentando..." : "Reintentar ahora"}
          </Button>
        </div>
      )}
    </Alert>
  );
}
