import type { ReactNode } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

const TONE_CLASSES = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
  muted: "border-muted-foreground/20 bg-muted text-muted-foreground",
  info: "border-info/20 bg-info/10 text-info",
} as const;

type StatusBadgeProps = {
  children: ReactNode;
  tone: keyof typeof TONE_CLASSES;
  icon?: ReactNode;
  dot?: boolean;
  bordered?: boolean;
  className?: string;
};

/** Presentación compartida para estados; cada dominio conserva su propio mapeo de estados y etiquetas. */
export function StatusBadge({
  children,
  tone,
  icon,
  dot = false,
  bordered = true,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        TONE_CLASSES[tone],
        !bordered && "border-transparent",
        dot && "gap-1.5",
        "font-medium",
        className,
      )}
    >
      {icon}
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </Badge>
  );
}
