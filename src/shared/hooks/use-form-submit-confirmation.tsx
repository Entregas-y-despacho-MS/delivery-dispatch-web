import { useState } from "react";

import { ConfirmActionDialog } from "@/shared/components/common/confirm-action-dialog";

/** Pide confirmación después de validar y antes de ejecutar el guardado del formulario. */
export function useFormSubmitConfirmation(actionName: string, editing: boolean) {
  const [pendingSubmit, setPendingSubmit] = useState<(() => Promise<void>) | null>(null);
  const [confirming, setConfirming] = useState(false);

  const requestConfirmation = (submit: () => Promise<void>) => setPendingSubmit(() => submit);
  const closeConfirmation = () => {
    if (!confirming) setPendingSubmit(null);
  };
  const confirm = async () => {
    if (!pendingSubmit) return;
    setConfirming(true);
    try {
      await pendingSubmit();
    } catch {
      // Los formularios muestran el error junto a sus campos al cerrarse esta confirmación.
    } finally {
      setConfirming(false);
      setPendingSubmit(null);
    }
  };

  const confirmationDialog = (
    <ConfirmActionDialog
      open={pendingSubmit !== null}
      onOpenChange={(open) => !open && closeConfirmation()}
      title={editing ? `Confirmar cambios de ${actionName}` : `Confirmar creación de ${actionName}`}
      description={editing
        ? "¿Deseas guardar los cambios realizados en este registro?"
        : "¿Deseas crear este registro con los datos ingresados?"}
      confirmLabel={editing ? "Confirmar cambios" : "Confirmar creación"}
      confirmVariant={editing ? "brandBlue" : "default"}
      busy={confirming}
      busyLabel="Guardando…"
      onConfirm={confirm}
    />
  );

  return { requestConfirmation, confirmationDialog };
}
