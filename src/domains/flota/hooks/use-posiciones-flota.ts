import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_POLICIES } from "@/shared/lib/query-policies";
import { useSocketEvents } from "@/shared/hooks/use-socket";
import { useUmbralesAlerta } from "@/domains/configuracion";
import { obtenerPosicionesFlota } from "../services/posiciones-flota.service";
import type { PosicionFlotaEnVivo, UbicacionFlotaActualizada } from "../flota-posiciones.types";

export const POSICIONES_FLOTA_KEY = ["fleet-live-positions"] as const;
const EVENTOS_FLOTA = ["dispatch.location.updated", "dispatch.status_changed", "route.assigned", "route.batch_reassigned"] as const;

function esUbicacionActualizada(payload: unknown): payload is UbicacionFlotaActualizada {
  if (!payload || typeof payload !== "object") return false;
  const evento = payload as Partial<UbicacionFlotaActualizada>;
  return Number.isInteger(evento.routeBatchId) && Number.isInteger(evento.dispatchId)
    && typeof evento.latitude === "number" && typeof evento.longitude === "number"
    && typeof evento.recordedAt === "string";
}

/** Carga inicial por REST, luego mantiene posiciones en vivo con el socket autenticado. */
export function usePosicionesFlota() {
  const queryClient = useQueryClient();
  const posiciones = useQuery({
    queryKey: POSICIONES_FLOTA_KEY,
    queryFn: ({ signal }) => obtenerPosicionesFlota(signal),
    ...QUERY_POLICIES.live,
  });
  const umbrales = useUmbralesAlerta();
  const refetchPosiciones = posiciones.refetch;

  const onEvent = useCallback((eventName: string, payload: unknown) => {
    if (eventName !== "dispatch.location.updated" || !esUbicacionActualizada(payload)) {
      void queryClient.invalidateQueries({ queryKey: POSICIONES_FLOTA_KEY });
      return;
    }

    let encontrado = false;
    queryClient.setQueryData<PosicionFlotaEnVivo[]>(POSICIONES_FLOTA_KEY, (actuales) => {
      if (!actuales) return actuales;
      const siguientes = actuales.map((posicion) => {
        if (posicion.routeBatchId !== payload.routeBatchId) return posicion;
        encontrado = true;
        return {
          ...posicion,
          lastLatitude: payload.latitude,
          lastLongitude: payload.longitude,
          lastLocationAt: payload.recordedAt,
        };
      });
      return siguientes;
    });
    if (!encontrado) void queryClient.invalidateQueries({ queryKey: POSICIONES_FLOTA_KEY });
  }, [queryClient]);

  const { connected } = useSocketEvents(EVENTOS_FLOTA, onEvent);
  useEffect(() => {
    if (connected) void refetchPosiciones();
  }, [connected, refetchPosiciones]);

  return { posiciones, umbrales, connected };
}
