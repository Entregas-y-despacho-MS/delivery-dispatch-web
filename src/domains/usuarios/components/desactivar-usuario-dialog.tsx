import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { useDesactivarUsuario } from "../hooks/use-usuarios";
import type { Usuario } from "../usuarios.types";

interface DesactivarUsuarioDialogProps {
  /** Usuario a desactivar. null = el modal está cerrado. */
  usuario: Usuario | null;
  onOpenChange: (open: boolean) => void;
}

/** Confirmación destructiva para desactivar una cuenta. Al cerrarse se desmonta y el error anterior se descarta. */
export function DesactivarUsuarioDialog({ usuario, onOpenChange }: DesactivarUsuarioDialogProps) {
  return (
    <Dialog open={usuario !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {usuario && <Contenido usuario={usuario} onCerrar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Contenido({ usuario, onCerrar }: { usuario: Usuario; onCerrar: () => void }) {
  const desactivar = useDesactivarUsuario(onCerrar);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Desactivar usuario</DialogTitle>
        <DialogDescription>
          ¿Seguro que quieres desactivar a <strong>{usuario.nombreCompleto}</strong> ({usuario.username})?
        </DialogDescription>
      </DialogHeader>

      {/* Impacto de la acción, antes de que la persona confirme. */}
      <div className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-1">
          <p>Esta persona perderá el acceso a la plataforma y no podrá iniciar sesión.</p>
          <p className="text-muted-foreground">
            Su historial se conserva y quedará como Inactivo en la lista. Antes de continuar, verifica que no tenga
            órdenes activas asignadas: si las tiene, reasígnalas primero.
          </p>
        </div>
      </div>

      {desactivar.errorInfo && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" aria-hidden />
          <AlertDescription>{desactivar.errorInfo.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {/* Cancelar va primero: es el foco inicial del modal, así Enter no destruye nada por accidente. */}
        <Button type="button" variant="outline" onClick={onCerrar} disabled={desactivar.isPending}>
          Cancelar
        </Button>
        <Button type="button" variant="destructive" onClick={() => desactivar.mutate(usuario)} disabled={desactivar.isPending}>
          {desactivar.isPending ? "Desactivando..." : "Desactivar usuario"}
        </Button>
      </div>
    </>
  );
}
