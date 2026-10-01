import type { LucideIcon } from "lucide-react";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export function FormDialogHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <DialogHeader className="flex-row items-start gap-3 pr-8 text-left sm:gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue ring-1 ring-brand-turquoise/15 sm:size-12">
        <Icon className="size-5 sm:size-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 space-y-1">
        <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </DialogTitle>
        <DialogDescription className="max-w-xl text-sm leading-5">
          {description}
        </DialogDescription>
      </span>
    </DialogHeader>
  );
}
