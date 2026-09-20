import { z } from "zod";

// El esquema vive junto al dominio que valida, no en una carpeta aparte.
export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
