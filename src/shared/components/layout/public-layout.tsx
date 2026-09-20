import { Link, Outlet } from "react-router-dom";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Button } from "@/shared/components/ui/button";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">delivery-dispatch-web</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm"><Link to="/login">Iniciar sesión</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} delivery-dispatch-web
      </footer>
    </div>
  );
}
