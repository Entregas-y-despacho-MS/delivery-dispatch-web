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
  "dispatch.location.updated",
  "integration.message_rejected",
  "integration.order_incomplete",
] as const;

/** Escucha eventos operativos y mantiene la caché Kanban al día; Socket.IO reconecta con backoff. */
export function useDispatchEvents() {
  const accessToken = useAuthStore((state) => state.access_token);
  const queryClient = useQueryClient();
  const [connectedToken, setConnectedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socketOrigin = new URL(env.VITE_API_URL).origin;
    const socket = io(`${socketOrigin}/app`, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
      autoConnect: true,
    });
    const invalidarTablero = () => {
      void queryClient.invalidateQueries({ queryKey: DISPATCHES_KANBAN_QUERY_KEY });
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
      socket.disconnect();
    };
  }, [accessToken, queryClient]);

  return { connected: Boolean(accessToken) && connectedToken === accessToken };
}
