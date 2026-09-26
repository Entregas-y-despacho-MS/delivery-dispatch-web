import { Clock } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { useIdleLogout } from "../hooks/use-idle-logout";

/** 95000 → "1:35" */
function formatearCuentaRegresiva(ms: number) {
  const segundos = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

/**
 * Aviso de cierre por inactividad (RF-A24). Se monta una sola vez en el DashboardLayout, así que
 * solo corre con sesión iniciada. Cerrar el modal (Esc o clic fuera) cuenta como "seguir conectado".
 */
export function IdleWarningDialog() {
  const { mostrarAviso, restanteMs, extenderSesion, cerrarSesion } = useIdleLogout();

  return (
    <Dialog open={mostrarAviso} onOpenChange={(open) => !open && extenderSesion()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" aria-hidden />
            ¿Sigues ahí?
          </DialogTitle>
          <DialogDescription>
            Por seguridad, tu sesión se cerrará por inactividad en:
          </DialogDescription>
        </DialogHeader>

        <p className="text-center text-4xl font-semibold tabular-nums" role="timer" aria-live="off">
          {formatearCuentaRegresiva(restanteMs)}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={cerrarSesion}>
            Cerrar sesión
          </Button>
          {/* Foco inicial en la opción segura: Enter mantiene la sesión. */}
          <Button type="button" onClick={extenderSesion} autoFocus>
            Seguir conectado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
