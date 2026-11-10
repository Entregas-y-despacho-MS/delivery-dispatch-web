import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { DialogContent } from "@/shared/components/ui/dialog";

/** Marco común para diálogos que crean, editan o modifican datos. */
export function FormDialogContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      {...props}
      data-form-dialog
      className={cn(
        "form-dialog-content max-h-[90dvh] overflow-y-auto bg-card motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** Pie común: apila y reordena las acciones en móvil y las alinea a la derecha en escritorio. */
export function FormDialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("form-dialog-footer flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end", className)}>
      {children}
    </div>
  );
}
