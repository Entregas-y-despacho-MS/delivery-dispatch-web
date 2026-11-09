import { io } from "socket.io-client";

import { env } from "@/config/env";

/** Socket.IO autenticado contra el namespace de operaciones del servicio. */
export function crearSocketOperativo(accessToken: string) {
  return io(`${env.VITE_SOCKET_URL}/app`, {
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 30_000,
    randomizationFactor: 0.5,
    autoConnect: true,
  });
}
