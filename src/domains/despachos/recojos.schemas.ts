import { z } from "zod";

import { hoyEnBolivia } from "./reprogramacion.reglas";
import type { CrearRecojoInput } from "./recojos.types";

/** Igual que el back: 6 a 30 caracteres, dígitos con +, espacios, paréntesis o guiones. */
const TELEFONO = /^(?=.{6,30}$)\+?[0-9][0-9 ()-]*$/;

const texto = (max: number, obligatorio: string) =>
  z.string().trim().min(1, obligatorio).max(max, `Usa máximo ${max} caracteres.`);
const opcional = (max: number) => z.string().trim().max(max, `Usa máximo ${max} caracteres.`);
const coordenada = (min: number, max: number, nombre: string) =>
  z.string().trim()
    .min(1, "Marca el punto en el mapa.")
    // Vacío ya lo avisa `min`: aquí solo se revisa el rango, para no mostrar dos errores a la vez.
    .refine((v) => v === "" || (/^-?\d+(\.\d+)?$/.test(v) && Number(v) >= min && Number(v) <= max), `${nombre} debe estar entre ${min} y ${max}.`);

/**
 * Formulario «Nuevo recojo» (ST-81.1), con las mismas reglas que CreatePickupOrderDto. Los campos van
 * como texto (lo que se escribe) y se convierten al enviar. `hoy` (AAAA-MM-DD en Bolivia) se pasa para poder probarlo.
 */
export function crearRecojoSchema(hoy = hoyEnBolivia(Date.now())) {
  return z.object({
    warehouseCode: z.string().min(1, "Elige el almacén de destino."),
    contactName: texto(150, "Escribe el nombre de quien entrega."),
    contactPhone: z.string().trim().regex(TELEFONO, "Escribe un teléfono de 6 a 30 caracteres: dígitos, y si quieres +, espacios, paréntesis o guiones."),
    contactEmail: opcional(150).refine((v) => v === "" || z.string().email().safeParse(v).success, "Escribe un correo válido o déjalo vacío."),
    address: texto(300, "Escribe la dirección del recojo."),
    reference: opcional(300),
    latitude: coordenada(-90, 90, "La latitud"),
    longitude: coordenada(-180, 180, "La longitud"),
    preferredPickupDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha del recojo.")
      .refine((v) => v >= hoy, "La fecha no puede ser anterior a hoy."),
    packageContents: texto(500, "Describe qué se recoge."),
    estimatedBoxes: z.string().trim().refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 1000),
      "Las cajas van de 1 a 1000, o déjalo vacío.",
    ),
    returnReason: texto(500, "Escribe el motivo de la devolución."),
    rmaId: opcional(100),
  });
}

export type RecojoFormValues = z.infer<ReturnType<typeof crearRecojoSchema>>;

export const RECOJO_FORM_VACIO: RecojoFormValues = {
  warehouseCode: "", contactName: "", contactPhone: "", contactEmail: "", address: "", reference: "",
  latitude: "", longitude: "", preferredPickupDate: "", packageContents: "", estimatedBoxes: "", returnReason: "", rmaId: "",
};

/** Del formulario (ya validado) al cuerpo del POST: los opcionales vacíos van como null. */
export function aCrearRecojoInput(v: RecojoFormValues): CrearRecojoInput {
  const vacioANull = (valor: string) => (valor.trim() === "" ? null : valor.trim());
  return {
    warehouseCode: v.warehouseCode,
    contactName: v.contactName.trim(),
    contactPhone: v.contactPhone.trim(),
    contactEmail: vacioANull(v.contactEmail),
    address: v.address.trim(),
    reference: vacioANull(v.reference),
    latitude: Number(v.latitude),
    longitude: Number(v.longitude),
    preferredPickupDate: v.preferredPickupDate,
    packageContents: v.packageContents.trim(),
    estimatedBoxes: v.estimatedBoxes.trim() === "" ? null : Number(v.estimatedBoxes),
    returnReason: v.returnReason.trim(),
    rmaId: vacioANull(v.rmaId),
  };
}
