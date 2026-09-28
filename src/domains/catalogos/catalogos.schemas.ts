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

export const nivelServicioSchema = z.object({
  name: z.string().trim().min(1, "Ingresa el nombre del nivel").max(50, "Usa máximo 50 caracteres"),
  description: z.string().trim().max(255, "Usa máximo 255 caracteres"),
  targetTimeMin: z.coerce
    .number({ invalid_type_error: "Ingresa un tiempo válido" })
    .int("Usa un número entero")
    .min(15, "El tiempo mínimo es de 15 minutos")
    .max(43200, "El tiempo máximo es de 30 días"),
  priorityLevel: z.coerce
    .number({ invalid_type_error: "Ingresa una prioridad válida" })
    .int("Usa un número entero")
    .min(1, "La prioridad mínima es 1")
    .max(32767, "La prioridad máxima es 32767"),
});

export type NivelServicioFormValues = z.infer<typeof nivelServicioSchema>;

export const motivoIncidenciaSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Ingresa el código del motivo").max(30, "Usa máximo 30 caracteres"),
  name: z.string().trim().min(1, "Ingresa el nombre del motivo").max(150, "Usa máximo 150 caracteres"),
  requiresEvidence: z.boolean(),
  active: z.boolean(),
});

export type MotivoIncidenciaFormValues = z.infer<typeof motivoIncidenciaSchema>;

const motivoReprogramacionCategoriaSchema = z.enum(["client", "operations", "force_majeure"], {
  required_error: "Selecciona el origen de la causa",
});

/** Comprueba que la respuesta del catálogo conserve los campos acordados con el backend. */
export const motivoReprogramacionResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: motivoReprogramacionCategoriaSchema,
  active: z.boolean(),
  affectsSla: z.boolean(),
  createdAt: z.string(),
});

export const motivoReprogramacionSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Ingresa el código del motivo").max(30, "Usa máximo 30 caracteres"),
  name: z.string().trim().min(1, "Ingresa el nombre del motivo").max(150, "Usa máximo 150 caracteres"),
  description: z.string().trim().max(255, "Usa máximo 255 caracteres"),
  category: motivoReprogramacionCategoriaSchema,
});

export type MotivoReprogramacionFormValues = z.infer<typeof motivoReprogramacionSchema>;
