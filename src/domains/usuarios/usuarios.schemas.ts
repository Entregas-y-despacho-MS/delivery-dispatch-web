import { z } from "zod";

interface ReglaPassword {
  id: string;
  etiqueta: string;
  cumple: (valor: string) => boolean;
}

/**
 * Política de contraseñas del backend (RF-A25, IsStrongPassword): mínimo 8 caracteres con
 * mayúscula, minúscula, número y símbolo. El backend puede exigir un mínimo mayor
 * (settings.password_min_length): en ese caso su respuesta 400 se muestra en el formulario.
 * Se exporta la lista para pintar los requisitos y marcar cuáles ya se cumplen.
 */
export const REGLAS_PASSWORD: readonly ReglaPassword[] = [
  { id: "longitud", etiqueta: "Al menos 8 caracteres", cumple: (v) => v.length >= 8 },
  { id: "mayuscula", etiqueta: "Una letra mayúscula", cumple: (v) => /[A-Z]/.test(v) },
  { id: "minuscula", etiqueta: "Una letra minúscula", cumple: (v) => /[a-z]/.test(v) },
  { id: "numero", etiqueta: "Un número", cumple: (v) => /\d/.test(v) },
  // Mismo conjunto de símbolos que valida el backend.
  { id: "simbolo", etiqueta: "Un símbolo (! # $ % & * …)", cumple: (v) => /[-#!$@£%^&*()_+|~=`{}[\]:";'<>?,./\\ ]/.test(v) },
];

const passwordSchema = z
  .string()
  .max(255, "Máximo 255 caracteres")
  .superRefine((valor, ctx) => {
    if (!valor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresa una contraseña" });
    } else if (REGLAS_PASSWORD.some((r) => !r.cumple(valor))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña no cumple todos los requisitos" });
    }
  });

const camposComunes = {
  fullName: z.string().trim().min(1, "Ingresa el nombre completo").max(150, "Máximo 150 caracteres"),
  username: z.string().trim().min(1, "Ingresa el nombre de usuario").max(50, "Máximo 50 caracteres"),
  // El correo es opcional: vacío es válido, pero si se escribe debe ser un correo real.
  email: z
    .string()
    .trim()
    .max(150, "Máximo 150 caracteres")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Ingresa un correo válido"),
  // El selector maneja texto; se convierte a número al enviar (ver toCrearPayload).
  roleId: z.string().min(1, "Selecciona un rol"),
};

/** Alta: la contraseña es obligatoria y debe cumplir la política. */
export const crearUsuarioSchema = z.object({ ...camposComunes, password: passwordSchema });

/** Edición: el formulario no muestra contraseña (el cambio de contraseña tiene su propio flujo). */
export const editarUsuarioSchema = z.object({ ...camposComunes, password: z.string() });

export type UsuarioFormValues = z.infer<typeof crearUsuarioSchema>;
