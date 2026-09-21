import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between md:gap-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="flex w-full shrink-0 items-center md:w-auto [&>*]:w-full md:[&>*]:w-auto">{action}</div>}
    </header>
  );
}
