import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  opcionesAprobarPromesas,
  opcionesAsignarVehiculo,
  opcionesReasignarRevisor,
} from "../planificacion.mutaciones";
import {
  aprobarPromesasLote,
  asignarVehiculoLote,
  reasignarRevisorLote,
} from "../services/lotes-provisionales.service";

interface Opciones {
  /** Se llama cuando el lote cambió en el back y la pantalla debe mostrar la versión vigente. */
  alRecargar?: () => void;
}

/**
 * Acciones del coordinador sobre un lote provisional (ST-215.1): aprobar promesas,
 * cambiar el vehículo y reasignar el lote. La lógica vive en `planificacion.mutaciones`.
 */
export function useAccionesLote({ alRecargar }: Opciones = {}) {
  const queryClient = useQueryClient();
  const base = { queryClient, alRecargar, avisar: { exito: toast.success, error: toast.error } };

  const aprobar = useMutation(opcionesAprobarPromesas({ ...base, aprobar: aprobarPromesasLote }));
  const vehiculo = useMutation(opcionesAsignarVehiculo({ ...base, asignar: asignarVehiculoLote }));
  const revisor = useMutation(opcionesReasignarRevisor({ ...base, reasignar: reasignarRevisorLote }));

  return {
    aprobarPromesas: aprobar.mutate,
    aprobando: aprobar.isPending,
    cambiarVehiculo: vehiculo.mutate,
    cambiandoVehiculo: vehiculo.isPending,
    reasignarRevisor: revisor.mutate,
    reasignando: revisor.isPending,
    /** Hay una acción en curso: los botones del lote deben quedar deshabilitados. */
    ocupado: aprobar.isPending || vehiculo.isPending || revisor.isPending,
  };
}
