import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

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
}

export function ConfirmActionDialog({
  open, onOpenChange, title, description, confirmLabel, busyLabel = "Procesando…",
  busy = false, error, onConfirm,
}: ConfirmActionDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (busy && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
