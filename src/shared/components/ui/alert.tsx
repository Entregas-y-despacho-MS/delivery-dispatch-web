import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-xl border p-4 text-sm shadow-xs transition-colors has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] has-[>svg]:gap-x-3.5 has-[>[data-slot=alert-icon]]:grid-cols-[2.25rem_1fr] has-[>[data-slot=alert-icon]]:gap-x-3.5 [&>svg]:size-5 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        destructive:
          "bg-red-50/90 text-foreground border-red-200/90 dark:bg-red-950/30 dark:border-red-800/80 dark:text-red-100 *:data-[slot=alert-description]:text-red-900/85 dark:*:data-[slot=alert-description]:text-red-300/90 [&>svg]:text-red-600 dark:[&>svg]:text-red-400",
        warning:
          "bg-amber-50/90 text-foreground border-amber-200/90 dark:bg-amber-950/30 dark:border-amber-800/80 dark:text-amber-100 *:data-[slot=alert-description]:text-amber-900/85 dark:*:data-[slot=alert-description]:text-amber-300/90 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        success:
          "bg-emerald-50/90 text-foreground border-emerald-200/90 dark:bg-emerald-950/30 dark:border-emerald-800/80 dark:text-emerald-100 *:data-[slot=alert-description]:text-emerald-900/85 dark:*:data-[slot=alert-description]:text-emerald-300/90 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        info:
          "bg-sky-50/90 text-foreground border-sky-200/90 dark:bg-sky-950/30 dark:border-sky-800/80 dark:text-sky-100 *:data-[slot=alert-description]:text-sky-900/85 dark:*:data-[slot=alert-description]:text-sky-300/90 [&>svg]:text-brand-blue dark:[&>svg]:text-brand-turquoise",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-icon"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-background/80 shadow-xs border border-border/50 [&>svg]:size-4.5",
        className
      )}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight text-foreground text-sm leading-snug",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed mt-0.5",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="alert-action"
      className={cn(
        "col-start-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline cursor-pointer dark:text-brand-turquoise transition-colors mt-1.5 w-fit",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertIcon, AlertTitle, AlertDescription, AlertAction }
