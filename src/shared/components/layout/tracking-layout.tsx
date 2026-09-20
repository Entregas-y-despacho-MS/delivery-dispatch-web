import { Link, Outlet } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/**
 * Layout del portal del cliente final (RF-U14 a RF-U22).
 * Sin sidebar y sin sesión: se entra con un token de seguimiento en la URL.
 * Pensado para leerse en el teléfono.
 */
export function TrackingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <Link to="/seguimiento" className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Seguimiento de pedido</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        ¿Problemas con tu entrega? Comunícate con nuestro servicio al cliente.
      </footer>
    </div>
  );
}
