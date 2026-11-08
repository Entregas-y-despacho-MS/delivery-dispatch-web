import { z } from "zod";

const schema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SOCKET_URL: z.string().url().optional(),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error("Revisa tu archivo .env");
}

export const env = {
  ...parsed.data,
  VITE_SOCKET_URL:
    parsed.data.VITE_SOCKET_URL ?? new URL(parsed.data.VITE_API_URL).origin,
};
