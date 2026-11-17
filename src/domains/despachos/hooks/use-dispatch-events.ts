import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { env } from "@/config/env";
import { useAuthStore } from "@/shared/store/use-auth-store";

export const DISPATCHES_KANBAN_QUERY_KEY = ["dispatches-kanban"] as const;

export const DISPATCH_LIVE_EVENTS = [
  "dispatch.status_changed",
  "dispatch.incident_reported",
  "dispatch.evidence_registered",
  "dispatch.change_requires_attention",
  "route.assigned",
] as const;

const INVALIDATION_DEBOUNCE_MS = 500;

/** Escucha eventos operativos y mantiene la caché Kanban al día; Socket.IO reconecta con backoff. */
export function useDispatchEvents() {
  const accessToken = useAuthStore((state) => state.access_token);
  const queryClient = useQueryClient();
  const [connectedToken, setConnectedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${env.VITE_SOCKET_URL}/app`, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
      autoConnect: true,
    });
    let invalidationTimer: ReturnType<typeof setTimeout> | undefined;
    const invalidarTablero = () => {
      if (invalidationTimer !== undefined) clearTimeout(invalidationTimer);
      invalidationTimer = setTimeout(() => {
        invalidationTimer = undefined;
        void queryClient.invalidateQueries({ queryKey: DISPATCHES_KANBAN_QUERY_KEY });
      }, INVALIDATION_DEBOUNCE_MS);
    };
    const alConectar = () => setConnectedToken(accessToken);
    const alDesconectar = () => setConnectedToken(null);

    socket.on("connect", alConectar);
    socket.on("disconnect", alDesconectar);
    socket.on("connect_error", alDesconectar);
    for (const eventName of DISPATCH_LIVE_EVENTS) socket.on(eventName, invalidarTablero);

    return () => {
      socket.off("connect", alConectar);
      socket.off("disconnect", alDesconectar);
      socket.off("connect_error", alDesconectar);
      for (const eventName of DISPATCH_LIVE_EVENTS) socket.off(eventName, invalidarTablero);
      if (invalidationTimer !== undefined) clearTimeout(invalidationTimer);
      socket.disconnect();
    };
  }, [accessToken, queryClient]);

  return { connected: Boolean(accessToken) && connectedToken === accessToken };
}
