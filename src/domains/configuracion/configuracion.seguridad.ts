import { z } from "zod";

/** Solo estas seis claves pueden ser escritas por el administrador (ST-310.1). */
export const PASSWORD_KEYS = [
  "password_min_length",
  "password_expiration_days",
  "password_require_uppercase",
  "password_require_lowercase",
  "password_require_number",
  "password_require_symbol",
] as const;
export type PasswordKey = (typeof PASSWORD_KEYS)[number];

const entero = (min: number, max: number) => z.string().regex(/^\d+$/, "Escribe un número entero.")
  .refine((value) => Number(value) >= min && Number(value) <= max, `Debe estar entre ${min} y ${max}.`);

export const passwordSettingsSchema = z.object({
  password_min_length: entero(8, 128),
  password_expiration_days: entero(1, 3650),
  password_require_uppercase: z.enum(["true", "false"]),
  password_require_lowercase: z.enum(["true", "false"]),
  password_require_number: z.enum(["true", "false"]),
  password_require_symbol: z.enum(["true", "false"]),
});
export type PasswordValues = z.infer<typeof passwordSettingsSchema>;

export function passwordRequirements(values: PasswordValues): string[] {
  const requirements = [`Mínimo ${values.password_min_length} caracteres`];
  if (values.password_require_uppercase === "true") requirements.push("una mayúscula");
  if (values.password_require_lowercase === "true") requirements.push("una minúscula");
  if (values.password_require_number === "true") requirements.push("un número");
  if (values.password_require_symbol === "true") requirements.push("un símbolo");
  return requirements;
}
