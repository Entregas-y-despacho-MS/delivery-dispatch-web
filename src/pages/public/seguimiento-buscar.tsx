import { useState, type FormEvent } from "react";
import { ArrowRight, PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AccesoPorCodigo } from "@/domains/seguimiento";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

/**
 * Entrada pública del seguimiento: con el código de seguimiento + código al correo (ST-309.2) o con el token
 * del enlace (ST-224.2). El acceso por código se monta siempre (forceMount): cambiar de pestaña no pierde la sesión.
 */
export default function SeguimientoBuscarPage() {
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PackageSearch className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Sigue tu pedido</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Consulta el estado de tu entrega con el código de seguimiento o con el enlace que te enviamos.
        </p>

        <Tabs defaultValue="codigo" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="codigo">Con mi código</TabsTrigger>
            <TabsTrigger value="enlace">Con el enlace</TabsTrigger>
          </TabsList>
          <TabsContent value="codigo" forceMount className="pt-3 data-[state=inactive]:hidden">
            <AccesoPorCodigo />
          </TabsContent>
          <TabsContent value="enlace" className="pt-3">
            <BuscarPorEnlace />
          </TabsContent>
        </Tabs>
      </section>
    </section>
  );
}

/** El token del enlace del correo (ST-224.2): lleva a /seguimiento/:token. */
function BuscarPorEnlace() {
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
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        Ingresa el token del enlace de seguimiento que recibiste para consultar el estado de tu entrega.
      </p>
      <form onSubmit={buscar} className="space-y-3" noValidate>
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
    </>
  );
}
