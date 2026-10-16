import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { opcionesAprobarLoteFinal } from "../planificacion.mutaciones";
import { aprobarLoteFinal } from "../services/lotes-definitivos.service";

interface Opciones {
  /** Se llama cuando el lote cambió en el back y la pantalla debe mostrar la versión vigente. */
  alRecargar?: () => void;
}

/** 2.ª aprobación del lote definitivo (ST-51.1). La lógica vive en `opcionesAprobarLoteFinal`. */
export function useAprobacionFinal({ alRecargar }: Opciones = {}) {
  const queryClient = useQueryClient();
  const mutation = useMutation(opcionesAprobarLoteFinal({
    queryClient,
    alRecargar,
    avisar: { exito: toast.success, error: toast.error },
    aprobar: aprobarLoteFinal,
  }));

  return {
    aprobarLote: mutation.mutate,
    /** Indicador de envío: el botón muestra «Aprobando...» y queda deshabilitado. */
    aprobando: mutation.isPending,
  };
}
