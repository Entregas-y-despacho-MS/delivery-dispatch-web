import { useEffect, useState, useTransition } from "react";
import { isAxiosError } from "axios";
import { Pause, Play, RefreshCw, ServerCrash, TriangleAlert, WifiOff } from "lucide-react";
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
  /**
   * Habilita reintento automático con cuenta regresiva.
   * Si es true, usa 5 segundos por defecto. Si es un número, usa esa cantidad de segundos.
   */
  autoRetry?: boolean | number;
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

  const isNetwork =
    isOffline ||
    !parsed.status ||
    parsed.code === "ERR_NETWORK" ||
    (isAxiosError(error) && !error.response);

  if (isNetwork) {
    return {
      kind: "network",
      title: "Sin conexión con el servidor",
      description:
        fallbackDesc ??
        "No fue posible comunicarse con el servicio. Comprueba tu conexión a internet o verifica si el servidor está activo.",
      badgeLabel: isOffline ? "Desconectado" : "Falla de red",
    };
  }

  const isServer = Boolean(parsed.status && parsed.status >= 500);
  if (isServer) {
    return {
      kind: "server",
      title: "Error interno del servidor",
      description:
        fallbackDesc ??
        "El servidor encontró un error temporal (código 500). Por favor reintenta en unos instantes.",
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
 * Alerta contextual para fallas de red, errores HTTP 500 o fallos generales.
 * Incluye botón de reintento manual y cuenta regresiva de reintento automático opcional.
 */
export function ErrorAlert({
  error,
  title,
  description,
  onRetry,
  isRetrying = false,
  autoRetry = false,
  className,
}: ErrorAlertProps) {
  const classification = classifyError(error, description);
  const finalTitle = title ?? classification.title;
  const finalDescription = classification.description;

  const initialSeconds = typeof autoRetry === "number" ? autoRetry : autoRetry ? 5 : 0;
  const [countdown, setCountdown] = useState<number | null>(initialSeconds > 0 ? initialSeconds : null);
  const [isPaused, setIsPaused] = useState(false);
  const [isPendingLocal, startTransition] = useTransition();

  const activeLoading = isRetrying || isPendingLocal;

  // Manejo de la cuenta regresiva para reintento automático
  useEffect(() => {
    if (!onRetry || countdown === null || countdown <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Ejecutar reintento
          startTransition(() => {
            void onRetry();
          });
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isPaused, onRetry]);

  // Si vuelve la conexión a internet y estamos desconectados, reintentar automáticamente
  useEffect(() => {
    if (!onRetry) return;

    const handleOnline = () => {
      startTransition(() => {
        void onRetry();
      });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [onRetry]);

  const handleManualRetry = () => {
    setCountdown(null);
    if (!onRetry) return;
    startTransition(() => {
      void onRetry();
    });
  };

  const getIcon = () => {
    switch (classification.kind) {
      case "network":
        return <WifiOff className="size-5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />;
      case "server":
        return <ServerCrash className="size-5 text-destructive shrink-0" aria-hidden />;
      case "generic":
      default:
        return <TriangleAlert className="size-5 text-destructive shrink-0" aria-hidden />;
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
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 shadow-xs border transition-all animate-in fade-in-50",
        classification.kind === "network" && "border-amber-500/30 bg-amber-500/5",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTitle className="text-base font-semibold leading-none">{finalTitle}</AlertTitle>
            <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-mono tracking-tight">
              {classification.badgeLabel}
            </Badge>
          </div>
          <AlertDescription className="text-sm opacity-90 leading-relaxed">
            {finalDescription}
          </AlertDescription>

          {countdown !== null && countdown > 0 && (
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
              <span>Reintento automático en</span>
              <span className="font-semibold tabular-nums text-foreground">{countdown}s</span>
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="ml-2 inline-flex items-center gap-1 text-[11px] underline hover:text-foreground cursor-pointer"
                title={isPaused ? "Reanudar reintento automático" : "Pausar reintento automático"}
              >
                {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                {isPaused ? "Reanudar" : "Pausar"}
              </button>
            </p>
          )}
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
            className="gap-2 cursor-pointer shadow-xs font-medium hover:bg-accent"
          >
            <RefreshCw className={cn("size-3.5", activeLoading && "animate-spin")} aria-hidden />
            {activeLoading ? "Reintentando..." : "Reintentar ahora"}
          </Button>
        </div>
      )}
    </Alert>
  );
}
