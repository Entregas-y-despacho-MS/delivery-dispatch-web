import { z } from "zod";

import { REGLAS_PARAMETROS, validarCruces, validarParametro } from "./configuracion.reglas";
import type { CampoUmbral, ClaveParametroOperativo, ParametrosOperativos, UmbralesAlerta } from "./configuracion.types";
import { CAMPOS_UMBRAL, MENSAJE_RANGO_UMBRAL, RANGOS_UMBRAL } from "./configuracion.umbrales";

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

/** Valores del formulario de umbrales: texto, igual que lo que se escribe en el campo. */
export type UmbralesFormValues = Record<CampoUmbral, string>;

/** Un umbral: obligatorio, entero (sin decimales ni signos) y dentro del rango que acepta el back. */
function campoUmbral(campo: CampoUmbral) {
  const { min, max } = RANGOS_UMBRAL[campo];
  return z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio.")
    .regex(/^\d+$/, "Solo números enteros, sin decimales ni signos.")
    .refine((valor) => {
      const numero = Number(valor);
      return numero >= min && numero <= max;
    }, MENSAJE_RANGO_UMBRAL[campo]);
}

/** Esquema del formulario de umbrales de alerta (ST-67.2, escenario 2 de ES-67). */
export const umbralesSchema = z.object(
  Object.fromEntries(CAMPOS_UMBRAL.map((campo) => [campo, campoUmbral(campo)])) as Record<
    CampoUmbral,
    ReturnType<typeof campoUmbral>
  >,
);

/** De lo que devuelve el back a lo que muestra el formulario. */
export function umbralesAFormulario(umbrales: UmbralesAlerta): UmbralesFormValues {
  return {
    slaAlertMinOnTimePct: String(umbrales.slaAlertMinOnTimePct),
    gpsStaleAlertMinutes: String(umbrales.gpsStaleAlertMinutes),
    driverIncidentAlertPerDay: String(umbrales.driverIncidentAlertPerDay),
  };
}

/** Del formulario (ya validado) a lo que recibe el back. */
export function formularioAUmbrales(valores: UmbralesFormValues): UmbralesAlerta {
  return {
    slaAlertMinOnTimePct: Number(valores.slaAlertMinOnTimePct.trim()),
    gpsStaleAlertMinutes: Number(valores.gpsStaleAlertMinutes.trim()),
    driverIncidentAlertPerDay: Number(valores.driverIncidentAlertPerDay.trim()),
  };
}
