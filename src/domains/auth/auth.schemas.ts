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

/** Esquema para solicitud de enlace de recuperación de contraseña (RF-A23). */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo electrónico")
    .email("Ingresa un correo electrónico válido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Esquema para cambio de clave con token temporal (RF-A25, Escenario 1).
 * Exige mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo especial,
 * y coincidencia exacta con confirmación de contraseña.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "El token de restablecimiento es requerido"),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[a-z]/, "Debe incluir al menos una letra minúscula")
      .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
      .regex(/\d/, "Debe incluir al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe incluir al menos un carácter especial"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

