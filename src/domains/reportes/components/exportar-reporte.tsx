import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { descargarArchivo, generarCsv, nombreArchivoSla } from "../reportes.exportar";
import type { ReporteSla } from "../types/reportes.types";

/** Exporta en el navegador lo que muestra la pantalla, con los filtros aplicados. Sin filas no hay nada que exportar. */
export function ExportarReporteSla({ reporte, deshabilitado }: { reporte: ReporteSla | undefined; deshabilitado: boolean }) {
  const sinDatos = !reporte || reporte.rows.length === 0;

  const exportarCsv = () => {
    if (!reporte) return;
    const nombre = nombreArchivoSla(reporte, "csv");
    descargarArchivo(generarCsv(reporte), "text/csv;charset=utf-8", nombre);
    toast.success(`Descargamos ${nombre}`);
  };

  return (
    <Button type="button" className="h-10" onClick={exportarCsv} disabled={deshabilitado || sinDatos}>
      <FileText className="size-4" aria-hidden />
      Exportar CSV
    </Button>
  );
}
