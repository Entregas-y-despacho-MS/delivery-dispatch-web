import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { descargarArchivo } from "../reportes.exportar";
import { generarCsvFlota, generarExcelFlota, nombreArchivoFlota, sinDatosFlota, type ReporteFlota } from "../reportes.flota";
import { TIPO_XLSX } from "../reportes.xlsx";

/** Exporta en el navegador lo que muestra la pantalla, a CSV o a Excel. Sin datos no hay nada que exportar. */
export function ExportarReporteFlota({ reporte, deshabilitado }: { reporte: ReporteFlota | undefined; deshabilitado: boolean }) {
  const bloqueado = deshabilitado || !reporte || sinDatosFlota(reporte);

  const exportar = (formato: "csv" | "xlsx") => {
    if (!reporte) return;
    const nombre = nombreArchivoFlota(reporte, formato);
    if (formato === "csv") descargarArchivo(generarCsvFlota(reporte), "text/csv;charset=utf-8", nombre);
    else descargarArchivo(generarExcelFlota(reporte), TIPO_XLSX, nombre);
    toast.success(`Descargamos ${nombre}`);
  };

  return (
    <>
      <Button type="button" variant="outline" className="h-10" onClick={() => exportar("csv")} disabled={bloqueado}>
        <FileText className="size-4" aria-hidden />
        Exportar CSV
      </Button>
      <Button type="button" className="h-10" onClick={() => exportar("xlsx")} disabled={bloqueado}>
        <FileSpreadsheet className="size-4" aria-hidden />
        Exportar Excel
      </Button>
    </>
  );
}
