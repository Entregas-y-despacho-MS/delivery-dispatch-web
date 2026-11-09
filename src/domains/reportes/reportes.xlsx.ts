import type { Celda } from "./reportes.exportar";

/** Una hoja del libro: su nombre (máximo 31 caracteres, sin \ / ? * [ ] :) y sus filas. */
export interface HojaXlsx {
  nombre: string;
  filas: Celda[][];
}

/*
 * Excel sin dependencias: un .xlsx es un ZIP con unos XML adentro. Se guarda sin comprimir
 * (método «store»), que Excel, LibreOffice y Google Sheets abren sin problema. Los textos van
 * como «inlineStr», así ninguna celda se interpreta como fórmula.
 */

const codificador = new TextEncoder();

const escaparXml = (texto: string) =>
  texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Caracteres de control que el XML no admite.
    // oxlint-disable-next-line no-control-regex -- se quitan justamente los caracteres de control.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

/** 0 → A, 25 → Z, 26 → AA. */
export function letraColumna(indice: number): string {
  let resto = indice + 1;
  let letras = "";
  while (resto > 0) {
    const modulo = (resto - 1) % 26;
    letras = String.fromCharCode(65 + modulo) + letras;
    resto = Math.floor((resto - modulo) / 26);
  }
  return letras;
}

function celdaXml(valor: Celda, referencia: string): string {
  if (valor === null || valor === "") return "";
  if (typeof valor === "number" && Number.isFinite(valor)) return `<c r="${referencia}"><v>${valor}</v></c>`;
  return `<c r="${referencia}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(String(valor))}</t></is></c>`;
}

function hojaXml(filas: Celda[][]): string {
  const cuerpo = filas
    .map((celdas, fila) => {
      const contenido = celdas.map((valor, columna) => celdaXml(valor, `${letraColumna(columna)}${fila + 1}`)).join("");
      return `<row r="${fila + 1}">${contenido}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${cuerpo}</sheetData></worksheet>`;
}

const nombreHoja = (nombre: string) => nombre.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Hoja";

function archivosDelLibro(hojas: readonly HojaXlsx[]): { nombre: string; contenido: string }[] {
  const tipos = hojas
    .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");
  const hojasLibro = hojas
    .map((hoja, i) => `<sheet name="${escaparXml(nombreHoja(hoja.nombre))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  const relaciones = hojas
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join("");
  const encabezado = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
  return [
    {
      nombre: "[Content_Types].xml",
      contenido: `${encabezado}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
        + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
        + `<Default Extension="xml" ContentType="application/xml"/>`
        + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`
        + `${tipos}</Types>`,
    },
    {
      nombre: "_rels/.rels",
      contenido: `${encabezado}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`
        + `</Relationships>`,
    },
    {
      nombre: "xl/workbook.xml",
      contenido: `${encabezado}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" `
        + `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${hojasLibro}</sheets></workbook>`,
    },
    {
      nombre: "xl/_rels/workbook.xml.rels",
      contenido: `${encabezado}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relaciones}</Relationships>`,
    },
    ...hojas.map((hoja, i) => ({ nombre: `xl/worksheets/sheet${i + 1}.xml`, contenido: hojaXml(hoja.filas) })),
  ];
}

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(datos: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of datos) crc = TABLA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Arma el ZIP (sin compresión) con los archivos dados. */
function zip(archivos: readonly { nombre: string; contenido: string }[]): Uint8Array<ArrayBuffer> {
  const entradas = archivos.map((archivo) => {
    const nombre = codificador.encode(archivo.nombre);
    const datos = codificador.encode(archivo.contenido);
    return { nombre, datos, crc: crc32(datos) };
  });
  const tamanoLocal = entradas.reduce((suma, e) => suma + 30 + e.nombre.length + e.datos.length, 0);
  const tamanoCentral = entradas.reduce((suma, e) => suma + 46 + e.nombre.length, 0);
  const salida = new Uint8Array(new ArrayBuffer(tamanoLocal + tamanoCentral + 22));
  const vista = new DataView(salida.buffer);
  // Fecha fija (1/1/2026 00:00): el contenido no depende de cuándo se exporta.
  const HORA_DOS = 0;
  const FECHA_DOS = ((2026 - 1980) << 9) | (1 << 5) | 1;

  let posicion = 0;
  const desplazamientos: number[] = [];
  for (const e of entradas) {
    desplazamientos.push(posicion);
    vista.setUint32(posicion, 0x04034b50, true);
    vista.setUint16(posicion + 4, 20, true);
    vista.setUint16(posicion + 6, 0x0800, true);
    vista.setUint16(posicion + 8, 0, true);
    vista.setUint16(posicion + 10, HORA_DOS, true);
    vista.setUint16(posicion + 12, FECHA_DOS, true);
    vista.setUint32(posicion + 14, e.crc, true);
    vista.setUint32(posicion + 18, e.datos.length, true);
    vista.setUint32(posicion + 22, e.datos.length, true);
    vista.setUint16(posicion + 26, e.nombre.length, true);
    vista.setUint16(posicion + 28, 0, true);
    salida.set(e.nombre, posicion + 30);
    salida.set(e.datos, posicion + 30 + e.nombre.length);
    posicion += 30 + e.nombre.length + e.datos.length;
  }

  const inicioCentral = posicion;
  entradas.forEach((e, i) => {
    vista.setUint32(posicion, 0x02014b50, true);
    vista.setUint16(posicion + 4, 20, true);
    vista.setUint16(posicion + 6, 20, true);
    vista.setUint16(posicion + 8, 0x0800, true);
    vista.setUint16(posicion + 10, 0, true);
    vista.setUint16(posicion + 12, HORA_DOS, true);
    vista.setUint16(posicion + 14, FECHA_DOS, true);
    vista.setUint32(posicion + 16, e.crc, true);
    vista.setUint32(posicion + 20, e.datos.length, true);
    vista.setUint32(posicion + 24, e.datos.length, true);
    vista.setUint16(posicion + 28, e.nombre.length, true);
    vista.setUint16(posicion + 30, 0, true);
    vista.setUint16(posicion + 32, 0, true);
    vista.setUint16(posicion + 34, 0, true);
    vista.setUint16(posicion + 36, 0, true);
    vista.setUint32(posicion + 38, 0, true);
    vista.setUint32(posicion + 42, desplazamientos[i], true);
    salida.set(e.nombre, posicion + 46);
    posicion += 46 + e.nombre.length;
  });

  vista.setUint32(posicion, 0x06054b50, true);
  vista.setUint16(posicion + 4, 0, true);
  vista.setUint16(posicion + 6, 0, true);
  vista.setUint16(posicion + 8, entradas.length, true);
  vista.setUint16(posicion + 10, entradas.length, true);
  vista.setUint32(posicion + 12, posicion - inicioCentral, true);
  vista.setUint32(posicion + 16, inicioCentral, true);
  vista.setUint16(posicion + 20, 0, true);
  return salida;
}

/** Libro de Excel (.xlsx) con una hoja por cada elemento de `hojas`. */
export function generarXlsx(hojas: readonly HojaXlsx[]): Uint8Array<ArrayBuffer> {
  return zip(archivosDelLibro(hojas));
}

export const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
