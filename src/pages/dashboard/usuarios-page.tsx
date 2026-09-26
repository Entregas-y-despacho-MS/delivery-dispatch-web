import { useState } from "react";
import { Plus } from "lucide-react";

import { DesactivarUsuarioDialog, UsuarioDialog, UsuariosTable, type Usuario } from "@/domains/usuarios";
import { PageHeader } from "@/shared/components/common/page-header";
import { Button } from "@/shared/components/ui/button";

/** La página solo decide qué mostrar; la lógica y el diseño viven en domains/usuarios. */
export default function UsuariosPage() {
  // usuario = null abre el modal en modo alta; con un usuario, en modo edición.
  const [dialogo, setDialogo] = useState<{ abierto: boolean; usuario: Usuario | null }>({
    abierto: false,
    usuario: null,
  });

  // Usuario que se está por desactivar; null = el modal de confirmación está cerrado.
  const [porDesactivar, setPorDesactivar] = useState<Usuario | null>(null);

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

      <UsuariosTable
        onEditar={(usuario) => setDialogo({ abierto: true, usuario })}
        onDesactivar={setPorDesactivar}
      />

      <UsuarioDialog
        open={dialogo.abierto}
        onOpenChange={(abierto) => setDialogo((actual) => ({ ...actual, abierto }))}
        usuario={dialogo.usuario}
      />

      <DesactivarUsuarioDialog usuario={porDesactivar} onOpenChange={(abierto) => !abierto && setPorDesactivar(null)} />
    </div>
  );
}
