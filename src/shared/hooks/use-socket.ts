import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

import { crearSocketOperativo } from "@/shared/lib/socket";
import { useAuthStore } from "@/shared/store/use-auth-store";

/** Conecta mientras exista sesión, escucha los eventos indicados y limpia listeners al desmontar. */
export function useSocketEvents(
  eventNames: readonly string[],
  onEvent: (eventName: string, payload: unknown) => void,
) {
  const accessToken = useAuthStore((state) => state.access_token);
  const [connectedToken, setConnectedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket: Socket = crearSocketOperativo(accessToken);
    const onConnect = () => setConnectedToken(accessToken);
    const onDisconnect = () => setConnectedToken(null);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);

    const listeners = eventNames.map((eventName) => {
      const listener = (payload: unknown) => onEvent(eventName, payload);
      socket.on(eventName, listener);
      return { eventName, listener };
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      for (const { eventName, listener } of listeners) socket.off(eventName, listener);
      socket.disconnect();
    };
  }, [accessToken, eventNames, onEvent]);

  return { connected: Boolean(accessToken) && connectedToken === accessToken };
}
