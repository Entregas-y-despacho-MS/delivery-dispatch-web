import { Component, type ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";

/**
 * Sin esto, un error en cualquier componente deja la app en pantalla blanca.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; scope?: "global" | "page" },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const isPage = this.props.scope === "page";
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center" role="alert">
          <div>
            <h2 className="text-xl font-semibold">{isPage ? "Esta pantalla tuvo un problema" : "Algo salió mal"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPage ? "Puedes reintentar o abrir otra sección desde el menú." : "Recarga la página para continuar."}
            </p>
          </div>
          <Button onClick={isPage ? () => this.setState({ error: null }) : () => window.location.reload()}>
            {isPage ? "Reintentar pantalla" : "Recargar"}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
