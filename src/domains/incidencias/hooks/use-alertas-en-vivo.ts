import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useSocketEvents } from "@/shared/hooks/use-socket";
import { descripcionAlerta, enlaceAlerta, esAlertaLevantada, etiquetaTipoAlerta, EVENTO_ALERTA_LEVANTADA } from "../incidencias.alertas";
import { alertasKeys } from "./use-alertas-criticas";

const EVENTOS_ALERTAS = [EVENTO_ALERTA_LEVANTADA] as const;
/** Las advertencias se van solas; las críticas quedan hasta que alguien las cierre. */
const DURACION_ADVERTENCIA_MS = 10_000;

/**
 * Alertas en tiempo real (ES-66, Escenario 1): por cada `operational.alert_raised` muestra un toast
 * y recarga la lista y el contador. Al reconectar también recarga, por si llegó algo mientras tanto.
 * `hrefCentro` es la página de alertas del rol, a donde lleva el toast cuando no hay despacho.
 */
export function useAlertasEnVivo({ hrefCentro }: { hrefCentro: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const onEvent = useCallback((_evento: string, payload: unknown) => {
    if (!esAlertaLevantada(payload)) return;
    void queryClient.invalidateQueries({ queryKey: alertasKeys.all });

    // El evento no trae vehicleId: sin despacho, el toast lleva al centro de alertas.
    const enlace = enlaceAlerta({ dispatchId: payload.dispatchId, vehicleId: null })
      ?? { href: hrefCentro, etiqueta: "Ver alertas" };
    const critica = payload.severity === "critical";
    const mostrar = critica ? toast.error : toast.warning;
    mostrar(etiquetaTipoAlerta(payload.kind), {
      id: `alerta-${payload.id}`,
      description: descripcionAlerta(payload),
      duration: critica ? Infinity : DURACION_ADVERTENCIA_MS,
      action: { label: enlace.etiqueta, onClick: () => navigate(enlace.href) },
    });
  }, [queryClient, navigate, hrefCentro]);

  const { connected } = useSocketEvents(EVENTOS_ALERTAS, onEvent);

  useEffect(() => {
    if (connected) void queryClient.invalidateQueries({ queryKey: alertasKeys.all });
  }, [connected, queryClient]);

  return { connected };
}
