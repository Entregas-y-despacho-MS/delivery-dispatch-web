import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import type { Usuario } from "../usuarios.types";
import { UsuarioForm } from "./usuario-form";

interface UsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = alta de un usuario nuevo; con un usuario, edición con sus datos precargados. */
  usuario: Usuario | null;
}

/** Modal de alta y edición de usuarios. Al cerrarse se desmonta y el formulario vuelve a empezar limpio. */
export function UsuarioDialog({ open, onOpenChange, usuario }: UsuarioDialogProps) {
  const editando = usuario !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Modifica los datos del colaborador. Solo se guardan los campos que cambies."
              : "Registra a un colaborador interno para que pueda ingresar a la plataforma."}
          </DialogDescription>
        </DialogHeader>
        <UsuarioForm usuario={usuario} onGuardado={() => onOpenChange(false)} onCancelar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
