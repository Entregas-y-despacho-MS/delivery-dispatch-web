import { Suspense } from "react";
import { Link } from "react-router-dom";
import { LoadingScreen } from "@/shared/components/feedback/loading-screen";
import { PageErrorBoundary } from "@/shared/components/feedback/page-error-boundary";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Button } from "@/shared/components/ui/button";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 h-14 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">Delivery Dispatch</Link>
          <div className="flex items-center gap-2">
            <span className="[&_button]:text-sidebar-foreground [&_button]:hover:bg-sidebar-accent [&_button]:hover:text-sidebar-accent-foreground">
              <ThemeToggle />
            </span>
            <Button asChild size="sm"><Link to="/login">Iniciar sesión</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Suspense fallback={<LoadingScreen />}>
          <PageErrorBoundary />
        </Suspense>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} delivery-dispatch-web
      </footer>
    </div>
  );
}
