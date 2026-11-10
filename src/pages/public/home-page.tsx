import { ArrowRight, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";

export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-16">
      <section className="max-w-2xl text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PackageCheck className="size-8" aria-hidden />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Delivery Dispatch</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Tu entrega, más cerca</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Consulta el estado de tu pedido y revisa las actualizaciones de entrega con el token de seguimiento que recibiste.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/seguimiento">Seguir mi pedido <ArrowRight aria-hidden /></Link>
        </Button>
      </section>
    </section>
  );
}
