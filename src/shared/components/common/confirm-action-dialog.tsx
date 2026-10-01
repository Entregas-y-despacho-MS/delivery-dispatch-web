import type { ReactNode } from "react";
import { Package, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void | Promise<void>;
  icon?: ReactNode;
  confirmVariant?: "default" | "destructive";
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busyLabel = "Procesando…",
  busy = false,
  error,
  onConfirm,
  icon,
  confirmVariant = "default",
}: ConfirmActionDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (busy && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft/80 text-brand-blue dark:bg-brand-soft/30 dark:text-brand-turquoise border border-brand-turquoise/25 shadow-xs">
            {icon ?? <Package className="size-6 stroke-[1.75]" aria-hidden />}
          </div>

          <DialogHeader className="gap-1.5 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
              className="rounded-xl px-5 font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={busy}
              className="rounded-xl px-5 font-medium shadow-sm"
            >
              {busy ? busyLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
