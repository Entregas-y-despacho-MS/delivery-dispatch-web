import { z } from "zod";

/** NUMERIC(10,2) en el backend — 8 dígitos enteros + 2 decimales. */
const MAX_CAPACIDAD = 99999999.99;

const capacidadSchema = (etiqueta: string) =>
  z.coerce
    .number({ invalid_type_error: `${etiqueta} debe ser un número` })
    .positive(`${etiqueta} debe ser mayor que 0`)
    .max(MAX_CAPACIDAD, `${etiqueta} es demasiado grande`)
    .refine((value) => Number.isInteger(Math.round(value * 100)), `${etiqueta} admite hasta 2 decimales`);

export const vehiculoSchema = z.object({
  type: z.string().trim().min(1, "Ingresa el tipo de vehículo").max(50, "Usa máximo 50 caracteres"),
  model: z.string().trim().min(1, "Ingresa el modelo").max(100, "Usa máximo 100 caracteres"),
  plate: z.string().trim().toUpperCase().min(1, "Ingresa la placa").max(15, "Usa máximo 15 caracteres"),
  capacityKg: capacidadSchema("La capacidad en kg"),
  capacityM3: capacidadSchema("La capacidad en m³"),
});

export type VehiculoFormValues = z.infer<typeof vehiculoSchema>;
