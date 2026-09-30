import { Suspense } from "react";
import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { PageErrorBoundary } from "@/shared/components/feedback/page-error-boundary";
import { LoadingScreen } from "@/shared/components/feedback/loading-screen";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/**
 * Layout del portal del cliente final (RF-U14 a RF-U22).
 * Sin sidebar y sin sesión: se entra con un token de seguimiento en la URL.
 * Pensado para leerse en el teléfono.
 */
export function TrackingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 h-14 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <Link to="/seguimiento" className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-sidebar-primary" />
            <span className="font-semibold tracking-tight">Seguimiento de pedido</span>
          </Link>
          <span className="[&_button]:text-sidebar-foreground [&_button]:hover:bg-sidebar-accent [&_button]:hover:text-sidebar-accent-foreground">
            <ThemeToggle />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Suspense fallback={<LoadingScreen />}>
          <PageErrorBoundary />
        </Suspense>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        ¿Problemas con tu entrega? Comunícate con nuestro servicio al cliente.
      </footer>
    </div>
  );
}
