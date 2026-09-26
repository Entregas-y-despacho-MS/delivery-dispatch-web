import { z } from "zod";

const nivelServicioPriority = z.enum(["high", "medium", "low"]);

export const zonaSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Ingresa el código de la zona").max(20, "Usa máximo 20 caracteres"),
  name: z.string().trim().min(1, "Ingresa el nombre de la zona").max(100, "Usa máximo 100 caracteres"),
  estimatedTimeMin: z.coerce
    .number({ invalid_type_error: "Ingresa un tiempo válido" })
    .int("Usa un número entero")
    .positive("Debe ser mayor que 0"),
});

export type ZonaFormValues = z.infer<typeof zonaSchema>;

export const nivelServicioSchema = z.object({
  name: z.string().trim().min(1, "Ingresa el nombre del nivel").max(80, "Usa máximo 80 caracteres"),
  description: z.string().trim().min(1, "Ingresa una descripción").max(180, "Usa máximo 180 caracteres"),
  targetTimeMinutes: z.coerce
    .number({ invalid_type_error: "Ingresa un tiempo válido" })
    .int("Usa un número entero")
    .min(15, "El tiempo mínimo es de 15 minutos")
    .max(1440, "El tiempo máximo es de 24 horas"),
  priority: nivelServicioPriority,
});

export type NivelServicioFormValues = z.infer<typeof nivelServicioSchema>;
