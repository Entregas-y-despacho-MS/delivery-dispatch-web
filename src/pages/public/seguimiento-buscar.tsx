import { useState, type FormEvent } from "react";
import { ArrowRight, PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export default function SeguimientoBuscarPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const buscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valor = token.trim();
    if (!valor) {
      setError("Ingresa el token que aparece en tu enlace de seguimiento.");
      return;
    }
    setError(null);
    navigate(`/seguimiento/${encodeURIComponent(valor)}`);
  };

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PackageSearch className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Sigue tu pedido</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ingresa el token del enlace de seguimiento que recibiste para consultar el estado de tu entrega.
        </p>

        <form onSubmit={buscar} className="mt-6 space-y-3" noValidate>
          <div className="space-y-2">
            <Label htmlFor="tracking-token">Token de seguimiento</Label>
            <Input
              id="tracking-token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "tracking-token-error" : "tracking-token-help"}
              placeholder="Pega aquí el token del enlace"
              className="h-11"
            />
            {error ? (
              <p id="tracking-token-error" role="alert" className="text-sm text-destructive">{error}</p>
            ) : (
              <p id="tracking-token-help" className="text-xs text-muted-foreground">El token está incluido en el enlace que te enviaron.</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Consultar pedido <ArrowRight aria-hidden />
          </Button>
        </form>
      </section>
    </section>
  );
}
