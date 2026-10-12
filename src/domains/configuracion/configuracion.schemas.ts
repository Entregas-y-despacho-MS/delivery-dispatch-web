import { z } from "zod";

import { REGLAS_PARAMETROS, validarCruces, validarParametro } from "./configuracion.reglas";
import type { ClaveParametroOperativo, ParametrosOperativos } from "./configuracion.types";

export const CLAVES_PARAMETROS_OPERATIVOS = Object.keys(REGLAS_PARAMETROS) as ClaveParametroOperativo[];

interface OpcionesEsquemaParametros {
  /** Horario general de reparto: las ventanas de mañana y tarde deben caer dentro. */
  ventanaGeneral?: { inicio: string; fin: string };
  /**
   * Claves que hoy están vacías en el back (Operaciones aún no las definió).
   * Pueden seguir vacías: no se inventa un valor. Si el coordinador escribe algo, se valida normal.
   */
  clavesSinDefinir?: ReadonlySet<ClaveParametroOperativo>;
}

/**
 * Esquema del formulario de parámetros operativos (ST-57.1).
 * Cada error se asigna al campo que lo causa, para mostrarlo debajo y bloquear el guardado.
 */
export function crearParametrosSchema({ ventanaGeneral, clavesSinDefinir = new Set() }: OpcionesEsquemaParametros = {}) {
  const forma = Object.fromEntries(
    CLAVES_PARAMETROS_OPERATIVOS.map((clave) => [clave, z.string().trim()]),
  ) as Record<ClaveParametroOperativo, z.ZodString>;

  return z.object(forma).superRefine((valores, ctx) => {
    for (const clave of CLAVES_PARAMETROS_OPERATIVOS) {
      const valor = valores[clave];
      if (valor === "" && clavesSinDefinir.has(clave)) continue;
      const error = valor === "" ? "Este parámetro es obligatorio." : validarParametro(clave, valor);
      if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [clave], message: error });
    }

    for (const { clave, mensaje } of validarCruces(valores, ventanaGeneral)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [clave], message: mensaje });
    }
  });
}

export type ParametrosFormValues = ParametrosOperativos;
