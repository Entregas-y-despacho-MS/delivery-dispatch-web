import { useState } from "react";
import { Plus, TriangleAlert } from "lucide-react";

import { UsuarioDialog, UsuariosTable, useUsuarios, type Usuario } from "@/domains/usuarios";
import { PageHeader } from "@/shared/components/common/page-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

/** La página solo decide qué mostrar; la lógica y el diseño viven en domains/usuarios. */
export default function UsuariosPage() {
  const { data, isPending, isError, refetch } = useUsuarios();
  // usuario = null abre el modal en modo alta; con un usuario, en modo edición.
  const [dialogo, setDialogo] = useState<{ abierto: boolean; usuario: Usuario | null }>({
    abierto: false,
    usuario: null,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="RF-A26 a RF-A28 — usuarios internos y roles"
        action={
          <Button onClick={() => setDialogo({ abierto: true, usuario: null })}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nuevo usuario
          </Button>
        }
      />

      {isError ? (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" aria-hidden />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            No se pudo cargar la lista de usuarios.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <UsuariosTable
          usuarios={data?.items ?? []}
          loading={isPending}
          onEditar={(usuario) => setDialogo({ abierto: true, usuario })}
        />
      )}

      <UsuarioDialog
        open={dialogo.abierto}
        onOpenChange={(abierto) => setDialogo((actual) => ({ ...actual, abierto }))}
        usuario={dialogo.usuario}
      />
    </div>
  );
}
