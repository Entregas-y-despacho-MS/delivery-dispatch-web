import { z } from "zod";

const schema = z.object({
  VITE_API_URL: z.string().url(),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Revisa tu archivo .env");
}

export const env = parsed.data;
