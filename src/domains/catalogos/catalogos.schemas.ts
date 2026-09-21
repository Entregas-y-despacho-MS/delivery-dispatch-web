import { z } from "zod";

export const zonaSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Ingresa el código de la zona").max(20, "Usa máximo 20 caracteres"),
  name: z.string().trim().min(1, "Ingresa el nombre de la zona").max(100, "Usa máximo 100 caracteres"),
  estimatedTimeMin: z.coerce
    .number({ invalid_type_error: "Ingresa un tiempo válido" })
    .int("Usa un número entero")
    .positive("Debe ser mayor que 0"),
});

export type ZonaFormValues = z.infer<typeof zonaSchema>;
