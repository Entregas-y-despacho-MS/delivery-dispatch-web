import { z } from "zod";

// El esquema vive junto al dominio que valida, no en una carpeta aparte.
// En el login solo se exige que los campos no vengan vacíos: la complejidad y la caducidad
// de la contraseña son política del backend (RF-A25) y se validan al crearla o cambiarla,
// no al entrar. Un min(6) aquí bloquearía cuentas válidas.
export const loginSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu usuario"),
  password: z.string().min(1, "Ingresa tu contraseña"),
  // Solo aparece cuando la cuenta tiene verificación en dos pasos (TOTP_REQUIRED).
  totpCode: z
    .string()
    .regex(/^\d{6}$/, "El código tiene 6 dígitos")
    .optional()
    .or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
