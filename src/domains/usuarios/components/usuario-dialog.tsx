import { FormDialogHeader } from "@/shared/components/common/form-dialog-header";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { UserRoundPlus } from "lucide-react";
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
      <DialogContent data-form-dialog className="form-dialog-content max-h-[90dvh] overflow-y-auto bg-card sm:max-w-2xl motion-reduce:animate-none">
        <FormDialogHeader icon={UserRoundPlus}
          title={editando ? "Editar usuario" : "Nuevo usuario"}
          description={editando
            ? "Modifica los datos del colaborador. Solo se guardan los campos que cambies."
            : "Registra a un colaborador interno para que pueda ingresar a la plataforma."} />
        <UsuarioForm usuario={usuario} onGuardado={() => onOpenChange(false)} onCancelar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
