import { z } from "zod";

const schema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_WS_URL: z.string().url().optional(),
  VITE_SITE_URL: z.string().url().optional(),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Revisa tu archivo .env");
}

export const env = parsed.data;

/** El gateway de WebSocket; por defecto el mismo host del API. */
export const WS_URL = env.VITE_WS_URL ?? env.VITE_API_URL.replace(/\/api\/?$/, "");
