import axios from "axios";

import { env } from "@/config/env";

/**
 * Cliente HTTP del portal del cliente final (RF-U14). No usa `api`: aquí no hay sesión que
 * renovar ni token que mandar, y cada pantalla muestra sus propios errores (sin toasts globales).
 */
export const publicApi = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});
