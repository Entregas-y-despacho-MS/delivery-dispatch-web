import type { ItemRecepcion, ResultadoRecepcion } from "./recepcion.types";

/** Tono visual de cada resultado: verde, ámbar o rojo. */
export type TonoRecepcion = "ok" | "diferencias" | "rechazo";

export const RESULTADOS_RECEPCION: Record<ResultadoRecepcion, { etiqueta: string; tono: TonoRecepcion }> = {
  complete: { etiqueta: "Recibido", tono: "ok" },
  with_differences: { etiqueta: "Con diferencias", tono: "diferencias" },
  rejected: { etiqueta: "Rechazado", tono: "rechazo" },
};

export const esResultadoRecepcion = (valor: unknown): valor is ResultadoRecepcion =>
  typeof valor === "string" && Object.hasOwn(RESULTADOS_RECEPCION, valor);

/** Si el back mandara un resultado nuevo, se muestra tal cual en vez de romper la pantalla. */
export const etiquetaResultadoRecepcion = (resultado: string) =>
  esResultadoRecepcion(resultado) ? RESULTADOS_RECEPCION[resultado].etiqueta : resultado;

export const tonoResultadoRecepcion = (resultado: string): TonoRecepcion =>
  esResultadoRecepcion(resultado) ? RESULTADOS_RECEPCION[resultado].tono : "diferencias";

/** Producto por su código, o el bulto rastreado por su número. */
export function nombreItemRecepcion(item: Pick<ItemRecepcion, "itemCode" | "packageId">): string {
  if (item.itemCode) return item.itemCode;
  if (item.packageId !== null) return `Bulto #${item.packageId}`;
  return "Ítem sin identificar";
}

const formatoCantidad = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
/** Las cantidades pueden traer decimales (kg, litros); se muestran con hasta 2. */
export const formatearCantidad = (cantidad: number) => formatoCantidad.format(cantidad);

export const itemConDiferencia = (item: Pick<ItemRecepcion, "missingQuantity" | "damagedQuantity">) =>
  item.missingQuantity > 0 || item.damagedQuantity > 0;

export interface TotalesRecepcion {
  aceptados: number;
  faltantes: number;
  danados: number;
}

export const totalesRecepcion = (items: readonly ItemRecepcion[]): TotalesRecepcion =>
  items.reduce(
    (total, item) => ({
      aceptados: total.aceptados + item.acceptedQuantity,
      faltantes: total.faltantes + item.missingQuantity,
      danados: total.danados + item.damagedQuantity,
    }),
    { aceptados: 0, faltantes: 0, danados: 0 },
  );
